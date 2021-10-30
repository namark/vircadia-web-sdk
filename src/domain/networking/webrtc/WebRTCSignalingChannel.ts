//
//  WebRTCSignalingChannel.ts
//
//  Created by David Rowe on 17 May 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import { NodeTypeValue } from "../NodeType";
import Log from "../../shared/Log";


type EventCallback = (event: Event) => void;
type MessageEventCallback = (data: SignalingMessage) => void;
type CloseEventCallback = (event: CloseEvent) => void;
type SignalingMessage = { to: NodeTypeValue, from: NodeTypeValue, data: Record<string, unknown>, echo: boolean };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JSONParseResult = Record<string, unknown> | Array<any> | string | number | boolean | null;


/*@devdoc
 *  The <code>WebRTCSignalingChannel</code> class provides a WebRTC signaling channel for establishing WebRTC data channels with
 *  the domain server and assignment clients.
 *  A single signaling channel is used for establishing all the individual WebRTC data channels between the web client and
 *  each of the domain server and its assignment clients.
 *  <p>A WebSocket is used for the connection and the API is similar to the WebSocket API.</p>
 *  <p>C++: Akin to <code>WebRTCSignalingServer</code> though significantly different.
 *
 *  @class WebRTCSignalingChannel
 *  @param {string} websocketURL - The URL of the domain server's WebRTC signaling channel WebSocket.
 *
 *  @property {WebRTCSignalingChannel.ReadyState} CONNECTING=0 - The connection is opening. <em>Static.</em> <em>Read-only.</em>
 *      <p><em>Static</em></p>
 *      @static
 *  @property {WebRTCSignalingChannel.ReadyState} OPEN=1 - The connection is open. <em>Static.</em> <em>Read-only.</em>
 *      <p><em>Static</em></p>
 *      @static
 *  @property {WebRTCSignalingChannel.ReadyState} CLOSING=2 - The connection is closing. <em>Static.</em> <em>Read-only.</em>
 *      <p><em>Static</em></p>
 *      @static
 *  @property {WebRTCSignalingChannel.ReadyState} CLOSED=3 - The connection is closed. <em>Static.</em> <em>Read-only.</em>
 *      <p><em>Static</em></p>
 *      @static
 *  @property {WebRTCSignalingChannel.ReadyState} readyState - The current state of the signaling channel connection.
 *      <em>Read-only.</em>
 *
 *  @property {WebRTCSignalingChannel~onOpenCallback} onopen - Sets a single function to be called when the signaling channel
 *      opens. <em>Write-only.</em>
 *  @property {WebRTCSignalingChannel~onMessageCallback} onmessage - Sets a single function to be called when a message is
 *      received. <em>Write-only.</em>
 *  @property {WebRTCSignalingChannel~onErrorCallback} onerror - Sets a single function to be called when an error occurs.
 *      <em>Write-only.</em>
 *  @property {WebRTCSignalingChannel~onCloseCallback} onclose - Set s a single function to be called when the signaling channel
 *      closes. <em>Write-only.</em>
 */
class WebRTCSignalingChannel {
    // C++  Related to WebRTCSignalingServer but significantly different.

    /*@devdoc
     *  The signaling messages are sent and received as JSON objects, with either a WebRTC signaling <code>data</code> payload
     *  or an </code>echo</code> request. The domain server or assignment client bounces echo requests back for testing
     *  purposes.
     *  @typedef {object} WebRTCSignalingChannel.SignalingMessage
     *  @property {NodeType} [to] - If sending to the domain server, the node that the message is for.
     *  @property {NodeType} [from] - If receiving from the domain server, the node that the message is from.
     *  @property {object} [data] - A WebRTC signaling payload.
     *  @property {string} [echo]- An echo request or response.
     */

    /*@devdoc
     *  Called when the signaling channel opens.
     *  @callback WebRTCSignalingChannel~onOpenCallback
     *  @param {Event} event - DOM event details.
     *  @memberOf WebRTCSignalingChannel
     */

    /*@devdoc
     *  Called when the signaling channel closes.
     *  @callback WebRTCSignalingChannel~onCloseCallback
     *  @param {number} code - The WebSocket close code provided by the server.
     *  @param {string} reason - The WebSocket close reason provided by the server.
     *  @param {boolean} wasClean - <code>true</codE> if the WebSocket connection closed cleanly, <code>false</code> if it
     *      didn't.
     */

    /*@devdoc
     *  Called when a WebRTC signaling message is received.
     *  @callback WebRTCSignalingChannel~onMessageCallback
     *  @param {WebRTCSignalingChannel.SignalingMessage} message - The WebRTC signaling message received.
     */

    /*@devdoc
     *  Called when there's an error in the signaling channel.
     *  @callback WebRTCSignalingChannel~onErrorCallback
     *  @param {Event} event - DOM event details.
     */


    /*@devdoc
     *  The state of a WebRTCSignalingChannel connection.
     *  <table>
     *      <thead>
     *          <tr><th>Name</th><th>Value</th><th>Description</th></tr>
     *      </thead>
     *      <tbody>
     *          <tr><td>CONNECTING</td><td>0</td><td>The connection is opening.</td></tr>
     *          <tr><td>OPEN</td><td>1</td><td>The connection is open.</td></tr>
     *          <tr><td>CLOSING</td><td>2</td><td>The connection is closing.</td></tr>
     *          <tr><td>CLOSED</td><td>3</td><td>The connection is closed.</td></tr>
     *      </tbody>
     *  </table>
     *  @typedef {number} WebRTCSignalingChannel.ReadyState
     */
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;


    #_websocket: WebSocket | null = null;


    constructor(websocketURL: string) {
        if (typeof websocketURL !== "string" || websocketURL === "") {
            Log.error("WebRTCSignalingChannel: Invalid WebSocket URL!");
        }
        try {
            this.#_websocket = new WebSocket(websocketURL);
        } catch (e) {
            this.#_websocket = null;
            // WEBRTC TODO: Surface error to DomainServer and assignment client APIs.
        }
    }


    get readyState(): number {
        return this.#_websocket ? this.#_websocket.readyState : WebRTCSignalingChannel.CLOSED;
    }

    set onopen(callback: EventCallback) {
        if (this.#_websocket) {
            this.#_websocket.onopen = callback;
        }
    }

    set onmessage(callback: MessageEventCallback) {
        if (this.#_websocket) {
            this.#_websocket.onmessage = function (event) {
                WebRTCSignalingChannel.#handleMessage(event, callback);
            };
        }
    }

    set onclose(callback: CloseEventCallback) {
        if (this.#_websocket) {
            this.#_websocket.onclose = callback;
        }
    }

    set onerror(callback: EventCallback) {
        if (this.#_websocket) {
            this.#_websocket.onerror = callback;
        }
    }


    /*@devdoc
     *  Sets a function to be called upon the occurrence of an <code>"open"</code>, <code>"message"</code>,
     *  <code>"error"</code>, or <code>"close"</code> event.
     *  Note: This enables you to add more than one function to be called upon an event, unlike the <code>onopen</code> etc.
     *  properties.
     *  @param {string} eventName - <code>"open"</code>, <code>"message"</code>, <code>"error"</code>, or <code>"close"</code>.
     *  @param {WebRTCSignalingChannel~onOpenCallback|WebRTCSignalingChannel~onMessageCallback
     *      |WebRTCSignalingChannel~onErrorCallback|WebRTCSignalingChannel~onCloseCallback} callback - The function to be called
     *      each time the event occurs.
     */
    addEventListener(eventName: string, callback: EventCallback | MessageEventCallback | CloseEventCallback): void {
        if (this.#_websocket) {
            this.#_websocket.addEventListener(eventName, function (event) {
                switch (event.type) {
                    case "open":
                    case "error":
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        <EventCallback><unknown>callback(<any>event);
                        break;
                    case "message":
                        WebRTCSignalingChannel.#handleMessage(<MessageEvent>event, <MessageEventCallback>callback);
                        break;
                    case "close":
                    default:
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        <EventCallback><unknown>callback(<any>event);
                        break;
                }
            });
        }
    }

    /*@devdoc
     *  Sends a message to the domain server or an assignment client on the signaling channel.
     *  <p>Note: The domain server or assignment client bounces echo requests back for testing purposes.</p>
     *  @param {WebRTCSignalingChannel.SignalingMessage} message - The message to send.
     *  @returns {boolean} <code>true</code> if the message was queued to be sent, <code>false</code) if the message wasn't
     *      queued (e.g., because the signaling channel isn't open).
     */
    send(message: object): boolean {  // eslint-disable-line @typescript-eslint/ban-types
        if (this.#_websocket && this.readyState === WebRTCSignalingChannel.OPEN) {
            this.#_websocket.send(JSON.stringify(message));
            return true;
        }

        Log.error("WebRTCSignalingChannel: Channel not open for sending!");
        if (this.#_websocket && this.#_websocket.onerror) {
            this.#_websocket.onerror(<Event><unknown>"Channel not open for sending!");
        }
        return false;
    }

    /*@devdoc
     *  Closes the signaling channel.
     */
    close(): void {
        if (this.#_websocket) {
            this.#_websocket.close();
            // WEBRTC FIXME: Set _websocket = null once the WebSocket has closed.
        }
    }


    static #handleMessage(event: MessageEvent, callback: MessageEventCallback): void {
        let success = false;
        if (typeof event.data === "string") {
            try {
                const json = <JSONParseResult>JSON.parse(event.data);
                if (json && json instanceof Object && !(json instanceof Array)) {
                    callback(<SignalingMessage>json);
                    success = true;
                }
            } catch (e) {
                //
            }
        }
        if (!success) {
            Log.error("WebRTCSignalingChannel: Invalid message received!");
        }
    }

}

export default WebRTCSignalingChannel;
export type { SignalingMessage };
