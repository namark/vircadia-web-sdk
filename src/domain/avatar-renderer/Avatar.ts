//
//  Avatar.ts
//
//  Created by David Rowe on 28 Oct 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import AvatarData from "../avatars/AvatarData";


/*@devdoc
 *  The <code>Avatar</code> class is concerned with the interaction of an avatar with the domain and other avatars.
 *  <p>C++: <code>class Avatar : public AvatarData, public ModelProvider, public MetaModelPayload</code></p>
 *  @class Avatar
 *  @extends AvatarData
 *  @extends SpatiallyNestable
 *  @param {number} contextID - The {@link ContextManager} context ID.
 *
 *  @property {string|null} displayName - The avatar's display name.
 *  @property {Signal} displayNameChanged - Triggered when the avatar's display name changes.
 *  @property {string|null} sessionDisplayName - The avatar's session display name as assigned by the avatar mixer. It is based
 *      on the display name and is unique among all avatars present in the domain. <em>Read-only.</em>
 *  @property {Signal} sessionDisplayNameChanged - Triggered when the avatar's session display name changes.
 */
class Avatar extends AvatarData {
    // C++  class Avatar : public AvatarData, public ModelProvider, public MetaModelPayload

    #_initialized = false;


    /*@devdoc
     *  Marks the avatar as having been initialized.
     */
    init(): void {
        // C++  void init()
        // No call to getHead().init() because it is an empty method.
        this.#_initialized = true;
    }

    /*@devdoc
     *  Gets whether the avatar has been initialized.
     *  @returns {boolean} <code>true</code> if the avatar has been initialized, <code>false</code> if it hasn't.
     */
    isInitialized(): boolean {
        // C++  bool isInitialized()
        return this.#_initialized;
    }

    /*@devdoc
     *  Declines to set the avatar's session display name.
     *  @returns {string|null} - The avatar's session display name.
     */
    // eslint-disable-next-line
    // @ts-ignore
    override setSessionDisplayName(sessionDisplayName: string | null): void {  // eslint-disable-line
        // C++  virtual void setSessionDisplayName(const QString& sessionDisplayName) override
        // No-op.
    }


    // eslint-disable-next-line class-methods-use-this
    protected override maybeUpdateSessionDisplayNameFromTransport(sessionDisplayName: string | null): void {
        // C++  void maybeUpdateSessionDisplayNameFromTransport(const QString& sessionDisplayName)
        this._sessionDisplayName = sessionDisplayName;
        this._sessionDisplayNameChanged.emit();
        // WEBRTC TODO: Address further C++ code - sessionDisplayNameChanged signal.
    }

}

export default Avatar;
