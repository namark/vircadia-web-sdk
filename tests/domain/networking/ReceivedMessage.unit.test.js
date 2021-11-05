//
//  ReceivedMessage.unit.test.js
//
//  Created by David Rowe on 10 Jun 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

/* eslint-disable @typescript-eslint/no-magic-numbers */

import NLPacket from "../../../src/domain/networking/NLPacket";
import Node from "../../../src/domain/networking//Node";
import ReceivedMessage from "../../../src/domain/networking/ReceivedMessage";
import SockAddr from "../../../src/domain/networking/SockAddr";
import Packet from "../../../src/domain/networking/udt/Packet";
import PacketType from "../../../src/domain/networking/udt/PacketHeaders";


describe("ReceivedMessage - unit tests", () => {

    test("Can create from an NLPacket", () => {
        /* eslint-disable-next-line max-len */
        const domainListText = "030000000218a3eda01ec4de456dbf07858a26c5a6486525652fd4cfdaef4ba3899b3a09e2c05f413fe2000000010100000000fd792d130005c48621581c4d000000000000003700418d539e40469f4f85991a2e26d3c1a103002bf9c711f29c00c0a8086ef29c0000079f00115b40fc7ccac5a9418c8a9d444018ad4d486f4062d328789b416a8146eae0f0d02655002bf9c711f29e00c0a8086ef29e0000079f0069c76bde4becd0ce442aa8cb5d13c87f286f6d6d2ae3a2ed67493c9fc3bcb8b601b924002bf9c711f29f00c0a8086ef29f0000079f003b4044eceda4577e4ca2a00f4177d64871e04d60256a079add443684315fb301da10a4002bf9c711f2a000c0a8086ef2a00000079f00bd916ff1ab42fdd64bc28bb5fc83fe7e3f72574c3a0cb9a21646948d73579b6b695dcf002bf9c711f2a100c0a8086ef2a10000079f00e77622cfcb8b839d42a9a56f7ff40b6eb0e0533ab0441a8a2f48a5a7a3956f0e9796a1002bf9c711f29d00c0a8086ef29d0000079f0093aca00ef67311254a43bbb63a403d885081";
        const arrayBuffer = new ArrayBuffer(domainListText.length / 2);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0, length = arrayBuffer.byteLength; i < length; i++) {
            uint8Array[i] = Number.parseInt(domainListText.substr(i * 2, 2), 16);
        }
        const dataView = new DataView(arrayBuffer);
        const sockAddr = new SockAddr();
        sockAddr.setPort(7);
        const packet = new Packet(dataView, dataView.byteLength, sockAddr);
        const nlPacket = new NLPacket(packet);
        expect(nlPacket.getType()).toBe(PacketType.DomainList);

        const receivedMessage = new ReceivedMessage(nlPacket);
        expect(receivedMessage.getSenderSockAddr().getPort()).toBe(7);
        expect(receivedMessage.getSourceID()).toBe(Node.NULL_LOCAL_ID);
        expect(receivedMessage.getType()).toBe(PacketType.DomainList);
        const messageData = receivedMessage.getMessageData();
        expect(messageData).toBe(nlPacket.getMessageData());
        expect(messageData.isComplete).toBe(true);
        const message = receivedMessage.getMessage();
        expect(message instanceof DataView).toBe(true);

        const NUM_NLPACKET_HEADER_BYTES = 2;  // WEBRTC TODO: This is just type and version. Should generalize per sourced and
        // verified packets.
        const numHeaderBytes = Packet.totalHeaderSize(nlPacket.getMessageData().isPartOfMessage) + NUM_NLPACKET_HEADER_BYTES;

        expect(message.byteLength).toBe(arrayBuffer.byteLength - numHeaderBytes);
    });

});
