//
//  MyAvatar.ts
//
//  Created by David Rowe on 28 Oct 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import Avatar from "../avatar-renderer/Avatar";
import Uuid from "../shared/Uuid";


/*@devdoc
 *  The <code>MyAvatar</code> class is concerned with the operation of user client's avatar.
 *  <p>C++: <code>class MyAvatar : public Avatar</code></p>
 *  @class MyAvatar
 *  @extends Avatar
 *  @extends AvatarData
 *  @extends SpatiallyNestable
 *
 *  @property {string|null} displayName - The avatar's display name.
 *  @property {Signal} displayNameChanged - Triggered when the avatar's display name changes.
 *  @property {string|null} sessionDisplayName - The avatar's session display name as assigned by the avatar mixer. It is based
 *      on the display name and is unique among all avatars present in the domain. <em>Read-only.</em>
 *  @property {Signal} sessionDisplayNameChanged - Triggered when the avatar's session display name changes.
 */
class MyAvatar extends Avatar {
    // C++  class MyAvatar : public Avatar

    readonly #MAX_DATA_RATE_MBPS = 3;
    readonly #BYTES_PER_KILOBYTE = 1000;
    readonly #KILO_PER_MEGA = 1000;
    readonly #BITS_IN_BYTE = 8;
    readonly #MSECS_PER_SECOND = 1000;

    readonly #maxDataRateBytesPerSeconds = this.#MAX_DATA_RATE_MBPS * this.#BYTES_PER_KILOBYTE * this.#KILO_PER_MEGA
        / this.#BITS_IN_BYTE;

    readonly #maxDataRateBytesPerMilliseconds = this.#maxDataRateBytesPerSeconds / this.#MSECS_PER_SECOND;

    #_nextTraitsSendWindow = 0;


    /*@devdoc
     *  Sends the avatar data in an {@link PacketType(1)|AvatarData} packet to the avatar mixer.
     *  @param {boolean} sendAll - <code>true</code> to send a full update even if nothing has changed, <code>false</code> to
     *      exclude certain data that hasn't changed since the last send.
     */
    override sendAvatarDataPacket(sendAll = false): number {
        // C++  int sendAvatarDataPacket(bool sendAll)

        let bytesSent = 0;

        const now = Date.now();
        if (now > this.#_nextTraitsSendWindow) {
            if (this.getIdentityDataChanged()) {
                bytesSent += this.sendIdentityPacket();
            }

            // WEBRTC TODO: Send PacketType.SetAvatarTraits.

            // Compute the next send window based on how much data we sent and what
            // data rate we're trying to max at.
            const timeUntilNextSend = bytesSent / this.#maxDataRateBytesPerMilliseconds;
            this.#_nextTraitsSendWindow += timeUntilNextSend;

            // Don't let the next send window lag behind if we're not sending a lot of data.
            if (this.#_nextTraitsSendWindow < now) {
                this.#_nextTraitsSendWindow = now;
            }
        }

        bytesSent += super.sendAvatarDataPacket(sendAll);

        return bytesSent;
    }


    /*@devdoc
     *  Sets the user client's (avatar's) session UUID and updates avatar attachments' links to it.
     *  @function MyAvatar.setSessionUUID
     *  @type {Slot}
     *  @param {Uuid} sessionUUID - The session UUID. If {@link Uuid|Uuid.NULL} then the session UUID is set to
     *      {@link Uuid|Uuid.AVATAR_SELF_ID}.
     */
    // Slot
    override setSessionUUID = (sessionUUID: Uuid): void => {
        // C++  void setSessionUUID(const QUuid& sessionUUID)
        super.setSessionUUID(sessionUUID);

        // WEBRTC TODO: Address further C++ code - avatar entity updates.

    };
}

export default MyAvatar;
