//
//  BasePacket.unit.test.js
//
//  Created by David Rowe on 9 Jun 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import SockAddr from "../../../../src/domain/networking/SockAddr";
import BasePacket from "../../../../src/domain/networking/udt/BasePacket";
import UDT from "../../../../src/domain/networking/udt/UDT";


describe("BasePacket - unit tests", () => {

    /* eslint-disable @typescript-eslint/no-magic-numbers */

    const IP_127_0_0_1 = 127 * 2 ** 24 + 1;  // 127.0.0.1

    const error = jest.spyOn(console, "error").mockImplementation((a) => {
        console.log(a);
    });

    function createPacketOfSize(size) {
        return new BasePacket(size);
    }

    function createPacketFromDataView() {
        const buffer = new ArrayBuffer(10);
        const dataView = new DataView(buffer);
        dataView.setUint8(0, 12);
        const sockAddr = new SockAddr();
        sockAddr.setAddress(IP_127_0_0_1);
        sockAddr.setPort(7);
        return new BasePacket(dataView, dataView.byteLength, sockAddr);
    }


    test("Static methods", () => {
        expect(BasePacket.maxPayloadSize()).toBe(UDT.MAX_PACKET_SIZE);
    });

    test("Can create an empty packet", () => {
        const packet = createPacketOfSize(14);
        expect(packet.getDataSize()).toBe(14);
        const messageData = packet.getMessageData();
        expect(messageData.packetSize).toBe(14);
        expect(messageData.data.byteLength).toBe(14);
        expect(messageData.buffer.byteLength).toBe(14);
        for (let i = 0; i < messageData.packetSize; i++) {
            expect(messageData.data.getUint8(i)).toBe(0);
        }
        expect(error).toHaveBeenCalledTimes(0);
    });

    test("Can create a packet based on a DataView", () => {
        const packet = createPacketFromDataView();
        expect(packet.getDataSize()).toBe(10);
        const messageData = packet.getMessageData();
        expect(messageData.dataPosition).toBe(0);
        expect(messageData.packetSize).toBe(10);
        expect(messageData.senderSockAddr.getAddress()).toBe(IP_127_0_0_1);
        expect(messageData.senderSockAddr.getPort()).toBe(7);
        expect(messageData.receiveTime).toEqual(0);
        expect(messageData.data.getUint8(0)).toBe(12);
        expect(error).toHaveBeenCalledTimes(0);
    });

    test("Can create a packet based on another", () => {
        const packetA = createPacketFromDataView();
        const time = Date.now();
        packetA.setReceiveTime(time);
        const packetB = new BasePacket(packetA);
        expect(packetB.getReceiveTime()).toBe(time);
        expect(packetB.getMessageData()).not.toBe(packetA.getMessageData());
        expect(packetB.getMessageData().data.getUint8(0)).toBe(12);
        expect(error).toHaveBeenCalledTimes(0);
    });

    test("Can set and get the received time", () => {
        const packet = createPacketFromDataView();
        const time = Date.now();
        packet.setReceiveTime(time);
        const timeReceived = packet.getReceiveTime();
        expect(timeReceived).toBe(time);
        expect(error).toHaveBeenCalledTimes(0);
    });

    test("Can reset a packet for rewriting its contents", () => {
        const packet = createPacketOfSize(8);
        expect(packet.getDataSize()).toBe(8);
        expect(packet.getMessageData().dataPosition).toBe(0);
        packet.getMessageData().dataPosition = 8;  // Simulate writing the packet.
        packet.reset();
        expect(packet.getMessageData().dataPosition).toBe(4);
    });


    error.mockReset();
});
