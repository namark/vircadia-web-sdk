//
//  ScriptAvatar.unit.test.js
//
//  Created by David Rowe on 11 Nov 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

/* eslint-disable @typescript-eslint/no-magic-numbers */

import DomainServer from "../../../src/DomainServer";
import AvatarManager from "../../../src/domain/AvatarManager";
import ScriptAvatar from "../../../src/domain/avatar-renderer/ScriptAvatar";
import MyAvatarInterface from "../../../src/domain/interfaces/MyAvatarInterface";
import ContextManager from "../../../src/domain/shared/ContextManager";
import Uuid from "../../../src/domain/shared/Uuid";
import Vec3 from "../../../src/domain/shared/Vec3";


describe("ScriptAvatar - unit tests", () => {

    /* eslint-disable @typescript-eslint/no-unsafe-call */

    test("A ScriptAvatar created from a null ID is invalid", () => {
        const scriptAvatar = new ScriptAvatar(null);
        // Null property values.
        expect(scriptAvatar.isValid).toBe(false);
        expect(scriptAvatar.displayName).toBe("");
        expect(scriptAvatar.sessionDisplayName).toBe("");
        expect(scriptAvatar.position).toEqual(Vec3.ZERO);
        // Can still access signals.
        expect(typeof scriptAvatar.displayNameChanged.connect).toBe("function");
        expect(typeof scriptAvatar.displayNameChanged.disconnect).toBe("function");
        expect(typeof scriptAvatar.sessionDisplayNameChanged.connect).toBe("function");
        expect(typeof scriptAvatar.sessionDisplayNameChanged.disconnect).toBe("function");
    });

    test("A ScriptAvatar created from an invalid session ID is invalid", () => {
        const log = jest.spyOn(console, "log").mockImplementation(() => { /* no-op */ });

        const domainServer = new DomainServer();
        const contextID = domainServer.contextID;
        ContextManager.set(contextID, AvatarManager, contextID);
        const avatarManager = ContextManager.get(contextID, AvatarManager);
        const scriptAvatar = new ScriptAvatar(avatarManager.getAvatarBySessionID(new Uuid(1234n)));
        // Null property values.
        expect(scriptAvatar.isValid).toBe(false);
        expect(scriptAvatar.displayName).toBe("");
        expect(scriptAvatar.sessionDisplayName).toBe("");
        expect(scriptAvatar.position).toEqual(Vec3.ZERO);
        // Can still access signals.
        expect(typeof scriptAvatar.displayNameChanged.connect).toBe("function");
        expect(typeof scriptAvatar.displayNameChanged.disconnect).toBe("function");
        expect(typeof scriptAvatar.sessionDisplayNameChanged.connect).toBe("function");
        expect(typeof scriptAvatar.sessionDisplayNameChanged.disconnect).toBe("function");

        log.mockReset();
    });

    test("A ScriptAvatar can be created for MyAvatar from AVATAR_SELF_ID", () => {
        const domainServer = new DomainServer();
        const contextID = domainServer.contextID;
        ContextManager.set(contextID, AvatarManager, contextID);
        const avatarManager = ContextManager.get(contextID, AvatarManager);
        const myAvatarInterface = new MyAvatarInterface(contextID);
        const TEST_DISPLAY_NAME = "Test display name";
        myAvatarInterface.displayName = TEST_DISPLAY_NAME;
        const scriptAvatar = new ScriptAvatar(avatarManager.getAvatarBySessionID(new Uuid(Uuid.AVATAR_SELF_ID)));
        expect(scriptAvatar.displayName).toBe(TEST_DISPLAY_NAME);
    });

});
