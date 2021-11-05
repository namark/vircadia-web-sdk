//
//  Uuid.unit.test.js
//
//  Created by David Rowe on 6 Jun 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

/* eslint-disable @typescript-eslint/no-magic-numbers */

import Uuid from "../../../src/domain/shared/Uuid";


describe("Uuid - unit tests", () => {

    test("The default UUID value is Uuid.NULL", () => {
        expect(new Uuid().valueOf()).toBe(Uuid.NULL);
    });

    test("Can initialize with a specified value", () => {
        // eslint-disable-next-line newline-per-chained-call
        expect(new Uuid(217897985291723272451165858623432009288n).valueOf().toString(16))
            .toBe("a3eda01ec4de456dbf07858a26c5a648");
    });

    test("Can get the underlying bigint primitive value", () => {
        const uuid = new Uuid(1234n);
        const value = uuid.value();
        expect(typeof value).toBe("bigint");
        expect(value).toBe(1234n);
    });

    test("Can stringify a Uuid", () => {
        const uuid = new Uuid(217897985291723272451165858623432009288n);
        expect(uuid.stringify()).toBe("a3eda01e-c4de-456d-bf07-858a26c5a648");
    });

    test("Can stringigy a null Uuid", () => {
        const uuid = new Uuid(0n);
        expect(uuid.stringify()).toBe("00000000-0000-0000-0000-000000000000");
    });

});
