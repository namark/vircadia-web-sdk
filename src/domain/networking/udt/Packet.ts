//
//  Packet.ts
//
//  Created by David Rowe on 9 Jun 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import BasePacket from "./BasePacket";
import SequenceNumber from "./SequenceNumber";
import UDT from "./UDT";
import SockAddr from "../SockAddr";
import assert from "../../shared/assert";


/*@devdoc
 *  The <code>Packet</code> class implements a basic Vircadia protocol packet.
 *  <p>See also: {@link BasePacket}, {@link NLPacket}, and {@link ControlPacket}.
 *  <p>C++ <code>Packet : public BasePacket</code></p>
 *  @class Packet
 *  @extends BasePacket
 *  @param {number|DataView|Packet} size|data|packet - The size of the packet to create, in bytes. If <code>-1</code>, a packet
 *      of the maximum size is created (though not all of it need be sent).
 *      <p>The raw byte data for a new packet.</p>
 *      <p>Another packet to reuse the packet data from. In this case, the packet's internal {@link MessageData} is reused by
 *      reference; it is not copied.</p>
 *  @param {boolean|number|unused} isReliable|size|unused - <code>true</code> if the packet is sent reliably, <code>false</code>
 *      if it isn't. <strong>Default Value:</strong> <code>false</code>
 *      <p>The size of the data in bytes.</p>
 *      <p>Unused.</p>
 *  @param {boolean|SockAddr|unused} isPartOfMessage|senderSockAddr|unused - <code>true</code> if the packet is part of a
 *      multi-packet message, <code>false</code> if it isn't. <strong>Default Value:</strong> <code>false</code>
 *      <p>The sender's IP address and port.</p>
 *      <p>Unused.</p>
 *
 *  @property {Packet.PacketPosition} PacketPosition - Packet position values.
 *      <em>Read-only.</em>
 *      <p><em>Static</em></p>
 *      @static
 *  @property {Packet.ObfuscationLevel} ObfuscationLevel - Obfuscation level values.
 *      <em>Read-only.</em>
 *      <p><em>Static</em></p>
 *      @static
 */
class Packet extends BasePacket {
    // C++  Packet : public BasePacket

    /*@devdoc
     *  The position of the packet in a multi-packet message. Two-bit values suitable for use in bitwise packet operations.
     *  <table>
     *      <thead>
     *          <tr><th>Name</th><th>Value</th><th>Description</th></tr>
     *      </thead>
     *      <tbody>
     *          <tr><td>ONLY</td><td>0</td><td><code>00</code> - The only packet in the message.</td></tr>
     *          <tr><td>FIRST</td><td>2</td><td><code>10</code> - The first packet in the message.</td></tr>
     *          <tr><td>MIDDLE</td><td>3</td><td><code>11</code> - A middle packet in the message.</td></tr>
     *          <tr><td>LAST</td><td>1</td><td><code>01</code> - The last packet in the message.</td></tr>
     *      </tbody>
     *  </table>
     *  @typedef {number} Packet.PacketPosition
     */
    static readonly PacketPosition = {
        // C++  enum PacketPosition : MessageNumberAndBitField
        ONLY: 0x0,   // 00
        FIRST: 0x2,  // 10
        MIDDLE: 0x3, // 11
        LAST: 0x1    // 01
    };

    /*@devdoc
     *  The obfuscation level used in the packet. Two-bit values suitable for use in bitwise packet operations.
     *  <table>
     *      <thead>
     *          <tr><th>Name</th><th>Value</th><th>Description</th></tr>
     *      </thead>
     *      <tbody>
     *          <tr><td>NoObfuscation</td><td>0</td><td><code>00</code> - No obfuscation.</td></tr>
     *          <tr><td>ObfuscationL1</td><td>1</td><td><code>01</code> - Obfuscation level 1.</td></tr>
     *          <tr><td>ObfuscationL2</td><td>2</td><td><code>10</code> - Obfuscation level 2.</td></tr>
     *          <tr><td>ObfuscationL3</td><td>3</td><td><code>11</code> - Obfuscation level 3.</td></tr>
     *      </tbody>
     *  </table>
     *  @typedef {number} Packet.ObfuscationLevel
     */
    static readonly ObfuscationLevel = {
        // C++  enum ObfuscationLevel : SequenceNumberAndBitField
        NoObfuscation: 0x0, // 00
        ObfuscationL1: 0x1, // 01
        ObfuscationL2: 0x2, // 10
        ObfuscationL3: 0x3  // 11
    };


    /*@devdoc
     *  Creates a new Packet from received data &mdash; an alternative to using <code>new Packet(...)</code>.
     *  <p><em>Static</em></p>
     *  @function Packet.fromReceivedPacket
     *  @param {DataView} data - The raw byte data of a new packet.
     *  @param {number} size - The size of that data in bytes.
     *  @param {SockAddr} senderSockAddr - The sender's IP address and port.
     *  @returns {Packet} A Packet created from the received data.
     *  @static
     */
    static fromReceivedPacket(data: DataView, size: number, senderSockAddr: SockAddr): Packet {
        // C++  Packet fromReceivedPacket(char[]* data, qint64 size, const SockAddr& senderSockAddr);
        return new Packet(data, size, senderSockAddr);
    }

    /*@devdoc
     *  Creates a copy of a Packet.
     *  <p><em>Static</em></p>
     *  @function Packet.createCopy
     *  @param {Packet} packet - The packet to copy.
     *  @returns {Packet} A copy of the packet.
     *  @static
     */
    static createCopy(other: Packet): Packet {
        // C++  Packet* createCopy(const Packet& other)
        return new Packet(other);
    }

    /*@devdoc
     *  Calculates the header size of a Packet.
     *  <p><em>Static</em></p>
     *  @function Packet.totalHeaderSize
     *  @param {boolean} [isPartOfMessage=false] - <code>true</code> if the packet is part of a message, <code>false</code> if
     *      it isn't.
     *  @returns {number} The total header size, in bytes.
     *  @static
     */
    static totalHeaderSize(isPartOfMessage = false): number {
        // C++  int totalHeaderSize(bool isPartOfMessage = false)
        // The BasePacket header size is 0 so no need to calculate that. Thus we can just directly include the localHeaderSize()
        // calculation.
        const SEQUENCE_NUMBER_AND_BITS_BYTES = 4;
        const MESSAGE_NUMBER_AND_PART_BYTES = 8;
        return SEQUENCE_NUMBER_AND_BITS_BYTES + (isPartOfMessage ? MESSAGE_NUMBER_AND_PART_BYTES : 0);
    }


    constructor(
        param0: number | DataView | Packet,
        param1: boolean | number | undefined = undefined,
        param2: boolean | SockAddr | undefined = undefined) {

        if (typeof param0 === "number" && typeof param1 === "boolean" && typeof param2 === "boolean") {
            // C++  Packet(qint64 size, bool isReliable = false, bool isPartOfMessage = false)
            const size = param0;
            const isReliable = param1;
            const isPartOfMessage = param2;

            super(size === -1 ? -1 : Packet.totalHeaderSize(isPartOfMessage) + size);
            this._messageData.isReliable = isReliable;
            this._messageData.isPartOfMessage = isPartOfMessage;
            this.#writeHeader();
            // adjustPayloadStartAndCapacity();  N/A

        } else if (param0 instanceof DataView && typeof param1 === "number" && param2 instanceof SockAddr) {
            // C++  Packet(std::unique_ptr<char[]> data, qint64 size, const SockAddr& senderSockAddr)
            const data = param0;
            const size = param1;
            const senderSockAddr = param2;

            super(data, size, senderSockAddr);
            this.#readHeader();
            // adjustPayloadStartAndCapacity();  N/A
            if (this._messageData.obfuscationLevel !== Packet.ObfuscationLevel.NoObfuscation) {
                console.warn("Packet() : Undo obfuscation : Not implemented!");

                // WEBRTC TODO: Address further C++ code.

            }

        } else if (param0 instanceof Packet) {
            // C++  Packet(Packet&& other)
            const packet = param0;

            super(packet);
            this._messageData.dataPosition = Packet.totalHeaderSize(this._messageData.isPartOfMessage);

        } else {
            console.error("Invalid parameters in Packet constructor!", typeof param0, typeof param1, typeof param2);
            super(0);
        }
    }


    /*@devdoc
     *  Gets whether the packet is part of a multi-packet message.
     *  @returns {boolean} <code>true</code> if the packet is part of a multi-packet message, <code>false</code> if it isn't.
     */
    isPartOfMessage(): boolean {
        // C++  bool isPartOfMessage()
        return this._messageData.isPartOfMessage;
    }

    /*@devdoc
     *  Gets whether the packet is sent reliably.
     *  @returns {boolean} <code>true</code> if the packet is to sent reliably, <code>false</code> if it isn't.
     */
    isReliable(): boolean {
        // C++  bool isPartOfMessage()
        return this._messageData.isReliable;
    }

    /*@devdoc
     *  Gets the message number of the packet.
     *  @returns {number} The message number of the packet
     */
    getMessageNumber(): number {
        // C++  MessageNumber getMessageNumber()
        return this._messageData.messageNumber;
    }

    /*@devdoc
     *  Gets the message part number of the packet.
     *  @returns {number} Gets the message part number of the packet.
     */
    getMessagePartNumber(): number {
        // C++  MessagePartNumber getMessagePartNumber()
        return this._messageData.messagePartNumber;
    }

    /*@devdoc
     *  Gets the position of the packet.
     *  @returns {Packet.PacketPosition} The position of the packet.
     */
    getPacketPosition(): number {
        // C++  PacketPosition getPacketPosition()
        return this._messageData.packetPosition;
    }

    /*@devdoc
     *  Writes a message number, position, and message part number into the packet.
     *  @param {number} messageNumber - The message number to write.
     *  @param {Packet.PacketPosition} position - The packet position to write.
     *  @param {number} messagePartNumber - The message part number to write.
     */
    writeMessageNumber(messageNumber: number, position: number, messagePartNumber: number): void {
        this._messageData.isPartOfMessage = true;
        this._messageData.messageNumber = messageNumber;
        this._messageData.packetPosition = position;
        this._messageData.messagePartNumber = messagePartNumber;
        this.#writeHeader(true);
    }

    /*@devdoc
     *  Writes a sequence number value into the packet.
     *  @param {SequenceNumber} sequenceNumber = The sequence number to write.
     */
    writeSequenceNumber(sequenceNumber: SequenceNumber): void {
        // C++ void writeSequenceNumber(SequenceNumber sequenceNumber)
        this._messageData.sequenceNumber = sequenceNumber.value;
        this.#writeHeader(true);
    }

    /*@devdoc
     *  Obfuscates a packet's contents in an attempt to get the packet through any packet filtering done on the network.
     *  @param {Packet.ObfuscationLevel} level - The obfuscation level.
     */
    // eslint-disable-next-line class-methods-use-this
    obfuscate(level: number): void {
        // C++  void obfuscate(ObfuscationLevel level)

        // WEBRTC TODO: Address further C++ code. - Obfuscate packet.

        console.warn("Packet.obfuscate() not implemented. Level:", level);
    }


    // Reads the packet header information from the data.
    #readHeader(): void {
        // C++  void readHeader()

        const seqNumBitField = this._messageData.data.getUint32(this._messageData.dataPosition, UDT.LITTLE_ENDIAN);

        assert((seqNumBitField & UDT.CONTROL_BIT_MASK) === 0, "Packet.readHeader()", "This should be a data packet!");
        this._messageData.isReliable = (seqNumBitField & UDT.RELIABILITY_BIT_MASK) > 0;
        this._messageData.isPartOfMessage = (seqNumBitField & UDT.MESSAGE_BIT_MASK) > 0;
        this._messageData.obfuscationLevel
            = (seqNumBitField & UDT.OBFUSCATION_LEVEL_BIT_MASK) >> UDT.OBFUSCATION_LEVEL_OFFSET;
        this._messageData.sequenceNumber = seqNumBitField & UDT.SEQUENCE_NUMBER_BIT_MASK;
        this._messageData.dataPosition += 4;

        if (this._messageData.isPartOfMessage) {
            const messageNumberAndBitField = this._messageData.data.getUint32(this._messageData.dataPosition,
                UDT.LITTLE_ENDIAN);
            this._messageData.dataPosition += 4;
            this._messageData.messageNumber = messageNumberAndBitField & UDT.MESSAGE_NUMBER_MASK;
            this._messageData.packetPosition = messageNumberAndBitField >> UDT.PACKET_POSITION_OFFSET;

            this._messageData.messagePartNumber = this._messageData.data.getUint32(this._messageData.dataPosition,
                UDT.LITTLE_ENDIAN);
            this._messageData.dataPosition += 4;
        } else {
            this._messageData.messageNumber = 0;
            this._messageData.packetPosition = Packet.PacketPosition.ONLY;
            this._messageData.messagePartNumber = 0;
        }
    }

    // Writes the packet header information to the data.
    #writeHeader(isOverwriting = false): void {
        // C++  void writeHeader()

        assert((this._messageData.sequenceNumber & UDT.BIT_FIELD_MASK) === 0, "Packet.writeHeader()",
            "Sequence number is overflowing into bit field");

        // If overwriting in a prepared packet, save the original dataPosition and reset the working value.
        const originalDataPosition = this._messageData.dataPosition;

        if (isOverwriting) {
            this._messageData.dataPosition = 0;
        }

        let seqNumBitField = this._messageData.sequenceNumber;
        if (this._messageData.isReliable) {
            seqNumBitField |= UDT.RELIABILITY_BIT_MASK;
        }
        if (this._messageData.isPartOfMessage) {
            seqNumBitField |= UDT.MESSAGE_BIT_MASK;
        }
        if (this._messageData.obfuscationLevel !== Packet.ObfuscationLevel.NoObfuscation) {
            seqNumBitField |= this._messageData.obfuscationLevel << UDT.OBFUSCATION_LEVEL_OFFSET;
        }
        this._messageData.data.setUint32(this._messageData.dataPosition, seqNumBitField, UDT.LITTLE_ENDIAN);
        this._messageData.dataPosition += 4;

        if (this._messageData.isPartOfMessage) {
            let messageNumberAndBitField = this._messageData.messageNumber;
            messageNumberAndBitField |= this._messageData.packetPosition << UDT.PACKET_POSITION_OFFSET;
            this._messageData.data.setUint32(this._messageData.dataPosition, messageNumberAndBitField, UDT.LITTLE_ENDIAN);
            this._messageData.dataPosition += 4;

            this._messageData.data.setUint32(this._messageData.dataPosition, this._messageData.messagePartNumber,
                UDT.LITTLE_ENDIAN);
            this._messageData.dataPosition += 4;
        }

        // If overwriting in a prepared packet, restore the original dataPosition.
        if (isOverwriting) {
            this._messageData.dataPosition = originalDataPosition;
        }

    }

}

export default Packet;
