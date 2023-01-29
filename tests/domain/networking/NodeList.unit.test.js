//
//  NodeList.unit.test.js
//
//  Created by David Rowe on 20 Jun 2021.
//  Copyright 2021 Vircadia contributors.
//  Copyright 2021 DigiSomni LLC.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import Packet from "../../../src/domain/networking/udt/Packet";
import PacketType from "../../../src/domain/networking/udt/PacketHeaders";
import AccountManager from "../../../src/domain/networking/AccountManager";
import AddressManager from "../../../src/domain/networking/AddressManager";
import DomainHandler from "../../../src/domain/networking/DomainHandler";
import NLPacket from "../../../src/domain/networking/NLPacket";
import Node from "../../../src/domain/networking/Node";
import NodePermissions from "../../../src/domain/networking/NodePermissions";
import NodeList from "../../../src/domain/networking/NodeList";
import NodeType from "../../../src/domain/networking/NodeType";
import ReceivedMessage from "../../../src/domain/networking/ReceivedMessage";
import SockAddr from "../../../src/domain/networking/SockAddr";
import ContextManager from "../../../src/domain/shared/ContextManager";
import Uuid from "../../../src/domain/shared/Uuid";

import { webcrypto } from "crypto";
globalThis.crypto = webcrypto;


describe("NodeList - integration tests", () => {

    /* eslint-disable @typescript-eslint/no-magic-numbers */
    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    const IP_127_0_0_1 = 127 * 2 ** 24 + 1;  // 127.0.0.1
    const IP_127_0_0_2 = 127 * 2 ** 24 + 2;  // 127.0.0.2

    const PORT_101 = 101;
    const PORT_102 = 102;
    const AUDIO_MIXER_NODE_INFO = {
        type: NodeType.AudioMixer,
        uuid: new Uuid(1234n),
        publicSocket: new SockAddr(),
        localSocket: new SockAddr(),
        permissions: new NodePermissions(),
        isReplicated: true,
        isUpstream: true,
        sessionLocalID: 11,
        connectionSecretUUID: new Uuid(5678n)
    };
    AUDIO_MIXER_NODE_INFO.publicSocket.setAddress(IP_127_0_0_1);
    AUDIO_MIXER_NODE_INFO.publicSocket.setAddress(IP_127_0_0_1);
    AUDIO_MIXER_NODE_INFO.publicSocket.setPort(PORT_101);
    AUDIO_MIXER_NODE_INFO.localSocket.setAddress(IP_127_0_0_2);
    AUDIO_MIXER_NODE_INFO.localSocket.setPort(PORT_102);

    const PORT_103 = 101;
    const PORT_104 = 102;
    const AVATAR_MIXER_NODE_INFO = {
        type: NodeType.AvatarMixer,
        uuid: new Uuid(5678n),
        publicSocket: new SockAddr(),
        localSocket: new SockAddr(),
        permissions: new NodePermissions(),
        isReplicated: true,
        isUpstream: true,
        sessionLocalID: 12,
        connectionSecretUUID: new Uuid(5678n)
    };
    AVATAR_MIXER_NODE_INFO.publicSocket.setAddress(IP_127_0_0_1);
    AVATAR_MIXER_NODE_INFO.publicSocket.setAddress(IP_127_0_0_1);
    AVATAR_MIXER_NODE_INFO.publicSocket.setPort(PORT_103);
    AVATAR_MIXER_NODE_INFO.localSocket.setAddress(IP_127_0_0_2);
    AVATAR_MIXER_NODE_INFO.localSocket.setPort(PORT_104);

    const contextID = ContextManager.createContext();
    ContextManager.set(contextID, AccountManager, contextID);  // Required by NodeList.
    ContextManager.set(contextID, AddressManager);  // Required by NodeList.
    ContextManager.set(contextID, NodeList, contextID);
    const nodeList = ContextManager.get(contextID, NodeList);

    // Suppress console messages from being displayed.
    const log = jest.spyOn(console, "log").mockImplementation(() => { /* no-op */ });


    test("Reports that it is not being used for the domain server connection", () => {
        expect(nodeList.isDomainServer()).toBe(false);
    });

    test("Can get the DomainHandler", () => {
        expect(nodeList.getDomainHandler() instanceof DomainHandler).toBe(true);
    });

    test("Can get the domain server's local ID and SockAddr", () => {
        expect(nodeList.getDomainLocalID()).toBe(0);
        expect(nodeList.getDomainSockAddr() instanceof SockAddr).toBe(true);
    });

    test("Can set and get the nodes interest set", () => {
        expect(nodeList.getNodeInterestSet().size).toBe(0);
        const setOfNodes = new Set([NodeType.EntityServer, NodeType.MessagesMixer]);
        nodeList.addSetOfNodeTypesToNodeInterestSet(setOfNodes);
        expect(nodeList.getNodeInterestSet()).toEqual(setOfNodes);
    });

    test("Can reset the nodes list", () => {
        nodeList.addOrUpdateNode(AUDIO_MIXER_NODE_INFO.uuid, AUDIO_MIXER_NODE_INFO.type,
            AUDIO_MIXER_NODE_INFO.publicSocket, AUDIO_MIXER_NODE_INFO.localSocket, AUDIO_MIXER_NODE_INFO.sessionLocalID,
            AUDIO_MIXER_NODE_INFO.isReplicated, AUDIO_MIXER_NODE_INFO.isUpstream, AUDIO_MIXER_NODE_INFO.connectionSecretUUID,
            AUDIO_MIXER_NODE_INFO.permissions
        );
        expect(nodeList.soloNodeOfType(AUDIO_MIXER_NODE_INFO.type) instanceof Node).toBe(true);
        // Reset the nodes list.
        nodeList.reset("Some reason");
        expect(nodeList.soloNodeOfType(AUDIO_MIXER_NODE_INFO.type)).toBeNull();
        // Resetting again is OK.
        nodeList.reset("Some reason");
        expect(nodeList.soloNodeOfType(AUDIO_MIXER_NODE_INFO.type)).toBeNull();
    });

    test("Can set the avatar gain", () => {
        const error = jest.spyOn(console, "error").mockImplementation(() => { /* no-op */ });
        const warn = jest.spyOn(console, "warn").mockImplementation(() => { /* no-op */ });

        // Master gain.
        nodeList.setSessionUUID(new Uuid(100));
        nodeList.setAvatarGain(new Uuid(Uuid.NULL), 3);
        expect(warn).toHaveBeenCalledTimes(1);  // Audio mixer not found.
        expect(error).toHaveBeenCalledTimes(0);

        // Avatar gain - own avatar.
        nodeList.setAvatarGain(new Uuid(100), 3);
        expect(warn).toHaveBeenCalledTimes(2);  // Own avatar ID.
        expect(error).toHaveBeenCalledTimes(0);

        // Avatar gain - other avatar.
        nodeList.setAvatarGain(new Uuid(200), 3);
        expect(warn).toHaveBeenCalledTimes(3);  // Audio mixer not found.
        expect(error).toHaveBeenCalledTimes(0);

        warn.mockRestore();
        error.mockRestore();
    });

    test("Can ignore and un-ignore a user", (done) => {
        let ignoreCount = 0;

        const onIgnoredNode = (nodeID, ignored) => {
            expect(nodeID.value()).toBe(300n);
            ignoreCount += 1;
            expect(ignored).toBe(ignoreCount === 1);
            nodeList.ignoredNode.disconnect(onIgnoredNode);
            if (ignoreCount === 2) {
                done();
            }
        };

        nodeList.addOrUpdateNode(AUDIO_MIXER_NODE_INFO.uuid, AUDIO_MIXER_NODE_INFO.type,
            AUDIO_MIXER_NODE_INFO.publicSocket, AUDIO_MIXER_NODE_INFO.localSocket, AUDIO_MIXER_NODE_INFO.sessionLocalID,
            AUDIO_MIXER_NODE_INFO.isReplicated, AUDIO_MIXER_NODE_INFO.isUpstream, AUDIO_MIXER_NODE_INFO.connectionSecretUUID,
            AUDIO_MIXER_NODE_INFO.permissions
        );
        nodeList.addOrUpdateNode(AVATAR_MIXER_NODE_INFO.uuid, AVATAR_MIXER_NODE_INFO.type,
            AVATAR_MIXER_NODE_INFO.publicSocket, AVATAR_MIXER_NODE_INFO.localSocket, AVATAR_MIXER_NODE_INFO.sessionLocalID,
            AVATAR_MIXER_NODE_INFO.isReplicated, AVATAR_MIXER_NODE_INFO.isUpstream, AVATAR_MIXER_NODE_INFO.connectionSecretUUID,
            AVATAR_MIXER_NODE_INFO.permissions
        );

        nodeList.ignoredNode.connect(onIgnoredNode);

        expect(nodeList.isIgnoringNode(new Uuid(300))).toBe(false);
        expect(nodeList.isPersonalMutingNode(new Uuid(300))).toBe(false);
        nodeList.ignoreNodeBySessionID(new Uuid(300), true);
        expect(nodeList.isIgnoringNode(new Uuid(300))).toBe(true);
        expect(nodeList.isPersonalMutingNode(new Uuid(300))).toBe(true);
        nodeList.ignoreNodeBySessionID(new Uuid(300), false);
        expect(nodeList.isIgnoringNode(new Uuid(300))).toBe(false);
        expect(nodeList.isPersonalMutingNode(new Uuid(300))).toBe(false);
    });

    test("Can mute and un-mute a user", () => {
        expect(nodeList.isIgnoringNode(new Uuid(301))).toBe(false);
        expect(nodeList.isPersonalMutingNode(new Uuid(301))).toBe(false);
        nodeList.personalMuteNodeBySessionID(new Uuid(301), true);
        expect(nodeList.isIgnoringNode(new Uuid(301))).toBe(false);
        expect(nodeList.isPersonalMutingNode(new Uuid(301))).toBe(true);
        nodeList.personalMuteNodeBySessionID(new Uuid(301), false);
        expect(nodeList.isIgnoringNode(new Uuid(301))).toBe(false);
        expect(nodeList.isPersonalMutingNode(new Uuid(301))).toBe(false);
    });

    test("Can remove a node from being ignored and muted", () => {

        nodeList.addOrUpdateNode(AUDIO_MIXER_NODE_INFO.uuid, AUDIO_MIXER_NODE_INFO.type,
            AUDIO_MIXER_NODE_INFO.publicSocket, AUDIO_MIXER_NODE_INFO.localSocket, AUDIO_MIXER_NODE_INFO.sessionLocalID,
            AUDIO_MIXER_NODE_INFO.isReplicated, AUDIO_MIXER_NODE_INFO.isUpstream, AUDIO_MIXER_NODE_INFO.connectionSecretUUID,
            AUDIO_MIXER_NODE_INFO.permissions
        );
        nodeList.addOrUpdateNode(AVATAR_MIXER_NODE_INFO.uuid, AVATAR_MIXER_NODE_INFO.type,
            AVATAR_MIXER_NODE_INFO.publicSocket, AVATAR_MIXER_NODE_INFO.localSocket, AVATAR_MIXER_NODE_INFO.sessionLocalID,
            AVATAR_MIXER_NODE_INFO.isReplicated, AVATAR_MIXER_NODE_INFO.isUpstream, AVATAR_MIXER_NODE_INFO.connectionSecretUUID,
            AVATAR_MIXER_NODE_INFO.permissions
        );

        expect(nodeList.isIgnoringNode(new Uuid(300))).toBe(false);
        expect(nodeList.isPersonalMutingNode(new Uuid(300))).toBe(false);
        nodeList.ignoreNodeBySessionID(new Uuid(300), true);
        expect(nodeList.isIgnoringNode(new Uuid(300))).toBe(true);
        expect(nodeList.isPersonalMutingNode(new Uuid(300))).toBe(true);
        nodeList.removeFromIgnoreMuteSets(new Uuid(300));
        expect(nodeList.isIgnoringNode(new Uuid(300))).toBe(false);
        expect(nodeList.isPersonalMutingNode(new Uuid(300))).toBe(false);
    });

    test("Can get and set requesting extra data", () => {
        expect(nodeList.getRequestsDomainListData()).toBe(false);
        nodeList.setRequestsDomainListData(true);
        expect(nodeList.getRequestsDomainListData()).toBe(true);
        nodeList.setRequestsDomainListData(false);
        expect(nodeList.getRequestsDomainListData()).toBe(false);
    });

    test("Can process a DomainServerConnectionToken packet", () => {
        const PACKET_HEX = "010000002e16cc4032f528fb46d8b2c7443664e27abf";
        const arrayBuffer = new ArrayBuffer(PACKET_HEX.length / 2);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0, length = arrayBuffer.byteLength; i < length; i++) {
            uint8Array[i] = Number.parseInt(PACKET_HEX.substr(i * 2, 2), 16);
        }
        const dataView = new DataView(arrayBuffer);
        const sockAddr = new SockAddr();
        sockAddr.setPort(7);
        const packet = new Packet(dataView, dataView.byteLength, sockAddr);
        const nlPacket = new NLPacket(packet);
        expect(nlPacket.getType()).toBe(PacketType.DomainServerConnectionToken);
        const receivedMessage = new ReceivedMessage(nlPacket);

        const domainHandler = nodeList.getDomainHandler();  // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        expect(domainHandler.getConnectionToken().value()).toBe(Uuid.NULL);
        expect(domainHandler.getSockAddr().isNull()).toBe(true);

        // No action when SockAddr is null.
        nodeList.processDomainServerConnectionTokenPacket(receivedMessage);
        expect(domainHandler.getConnectionToken().value()).toBe(Uuid.NULL);

        // Action when SockAddr has been set.
        domainHandler.setPort(7);
        expect(domainHandler.getSockAddr().isNull()).toBe(false);
        nodeList.processDomainServerConnectionTokenPacket(receivedMessage);
        expect(domainHandler.getConnectionToken().stringify()).toBe("cc4032f5-28fb-46d8-b2c7-443664e27abf");
    });

    test("Can mute a node", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(/* no-op */);
        expect(warn).toHaveBeenCalledTimes(0);
        const nodePermissions = new NodePermissions();
        nodePermissions.permissions = 0b111111111111;
        nodeList.setPermissions(nodePermissions);
        nodeList.muteNodeBySessionID(Uuid.createUuid());
        expect(warn).toHaveBeenCalledTimes(0);
        warn.mockRestore();
    });

    test("Cannot mute a node if node ID is null, node ID is own ID, self ID, not an admin, or no audio mixer", () => {
        let lastWarning = "";
        const warn = jest.spyOn(console, "warn").mockImplementation((message) => {
            lastWarning = message;  // eslint-disable-line
        });
        expect(warn).toHaveBeenCalledTimes(0);

        const nodePermissions = new NodePermissions();
        nodePermissions.permissions = 0b111111111111;
        nodeList.setPermissions(nodePermissions);

        // Null ID.
        nodeList.muteNodeBySessionID(new Uuid());
        expect(warn).toHaveBeenCalledTimes(1);
        expect(lastWarning).toContain("[networking] muteNodeBySessionID called with an invalid ID");

        // Own ID.
        nodeList.muteNodeBySessionID(nodeList.getSessionUUID());
        expect(warn).toHaveBeenCalledTimes(2);
        expect(lastWarning).toContain("[networking] muteNodeBySessionID called with an invalid ID");

        // Self ID.
        nodeList.muteNodeBySessionID(new Uuid(Uuid.AVATAR_SELF_ID));
        expect(warn).toHaveBeenCalledTimes(3);
        expect(lastWarning).toContain("[networking] muteNodeBySessionID called with an invalid ID");

        // Not an admin.
        nodePermissions.permissions = 0b000000000001;
        nodeList.setPermissions(nodePermissions);
        nodeList.muteNodeBySessionID(Uuid.createUuid());
        expect(warn).toHaveBeenCalledTimes(4);
        expect(lastWarning).toContain("[networking] You do not have permissions to mute");

        // No audio mixer.
        nodePermissions.permissions = 0b111111111111;
        nodeList.setPermissions(nodePermissions);
        nodeList.reset();
        nodeList.muteNodeBySessionID(Uuid.createUuid());
        expect(warn).toHaveBeenCalledTimes(5);
        expect(lastWarning).toContain("[networking] Couldn't find audio mixer");

        warn.mockRestore();
    });

    test("Can kick a node", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(/* no-op */);
        expect(warn).toHaveBeenCalledTimes(0);
        const nodePermissions = new NodePermissions();
        nodePermissions.permissions = 0b111111111111;
        nodeList.setPermissions(nodePermissions);
        nodeList.kickNodeBySessionID(Uuid.createUuid());
        expect(warn).toHaveBeenCalledTimes(0);
        warn.mockRestore();
    });

    test("Cannot kick a node if node ID is null, node ID is own ID, self ID, or not an admin", () => {
        let lastWarning = "";
        const warn = jest.spyOn(console, "warn").mockImplementation((message) => {
            lastWarning = message;  // eslint-disable-line
        });
        expect(warn).toHaveBeenCalledTimes(0);

        const nodePermissions = new NodePermissions();
        nodePermissions.permissions = 0b111111111111;
        nodeList.setPermissions(nodePermissions);

        // Null ID.
        nodeList.kickNodeBySessionID(new Uuid());
        expect(warn).toHaveBeenCalledTimes(1);
        expect(lastWarning).toContain("[networking] kickNodeBySessionID called with an invalid ID");

        // Own ID.
        nodeList.kickNodeBySessionID(nodeList.getSessionUUID());
        expect(warn).toHaveBeenCalledTimes(2);
        expect(lastWarning).toContain("[networking] kickNodeBySessionID called with an invalid ID");

        // Self ID.
        nodeList.kickNodeBySessionID(new Uuid(Uuid.AVATAR_SELF_ID));
        expect(warn).toHaveBeenCalledTimes(3);
        expect(lastWarning).toContain("[networking] kickNodeBySessionID called with an invalid ID");

        // Not an admin.
        nodePermissions.permissions = 0b000000000001;
        nodeList.setPermissions(nodePermissions);
        nodeList.kickNodeBySessionID(Uuid.createUuid());
        expect(warn).toHaveBeenCalledTimes(4);
        expect(lastWarning).toContain("[networking] You do not have permissions to kick");

        warn.mockRestore();
    });

    afterAll(() => {
        log.mockRestore();
    });

});
