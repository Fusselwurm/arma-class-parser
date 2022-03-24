import {parse} from './class-parser';

describe('arma-class-parser', () => {
    it("is defined", function() {
        expect(typeof parse).toBe('function')
    });
    it("complains on invalid input type", function() {
        expect(() => parse([] as any)).toThrowError(TypeError)
    });

    it("parses empty object", function() {

        let expected = {Moo: {}};
        let result = parse('class Moo {};');

        expect(result).toEqual(expected);
    });
    describe("syntax error handling", function () {
        it("stomachs hanging quote", function () {
            expect(() => parse("v=\"")).toThrow();
        })
    });

    describe("parsing numbers", function() {
        it("parses positive integer property values", function() {
            let expected = {Moo: {value: 1}};
            let result = parse('class Moo {\r\nvalue=1; };');

            expect(result).toEqual(expected);
        });
        it("parses negative integer property values", function() {

            let expected = {Moo: {value: -3}};
            let result = parse('class Moo {\r\nvalue=-3; };');

            expect(result).toEqual(expected);
        });

        it("knows to parse scientific notation (negative exponent)", function () {
            expect(parse("x=-1.5e2;")).toEqual({x: -1.5e2});
        });
        it("knows to parse scientific notation (implicitly positive exponent)", function () {
            expect(parse("x=1.5e2;")).toEqual({x: 1.5e2});
        });
        it("knows to parse scientific notation (explicitly positive exponent)", function () {
            expect(parse("x=+1.5e2;")).toEqual({x: 1.5e2});
        });
        it("parses scientific notation (negative, negative exponent prefixed w/ zeroes", function() {
            expect(parse("x=-1.9073486e-006;")).toEqual({x: -1.9073486e-6});
        });
    });

    it("finds more than one property", function () {
        let expected = {
            version: 12,
            Moo: {
                value: 1
            }
        };

        let result = parse('version=12;\n\nclass Moo  {\r\n value = 1; };');

        expect(result).toEqual(expected);
    });

    it("understands scalar array properties", function () {
        let expected = {
            Moo: {
                foo: ['bar', 'baz', 1.5e2]
            }
        };

        let result = parse('class Moo {\r\nfoo[]={"bar", "baz",1.5e2}; };');

        expect(result).toEqual(expected);
    });
    it("understands nested array properties", function () {
        let expected = {
            Moo: {
                foo: [[], ['foo'], [1,2]]
            }
        };

        let result = parse('class Moo {\r\nfoo[]={{}, {"foo"}, {1,2}}; };');

        expect(result).toEqual(expected);
    });
    it("doesnt skip a character after the semicolon", function () {
        let expected = {
            foo: [1, 2, 3],
            moo: [1, 2, 3]
        };

        let result = parse('foo[]={1,2,3};moo[]={1,2,3};');

        expect(result).toEqual(expected);
    });

    it("ignores symbols", function () {
        let testString = "class Moo {\n" +
            "\tfoo = xxx;\n" +
            "\tclass xxx {};\n" +
            "};";

        expect(parse(testString)).toEqual({Moo: {foo: NaN, xxx: {}}});
    });

    it("ignores an initial BOM", function () {
        let testString = "\ufeffclass Moo{};"
        expect(parse(testString)).toEqual({Moo: {}});
    });

    it("ignores inheritance (?)", function () {
        let testString = "class Moo : foo {};";
        expect(parse(testString)).toEqual({Moo: {}});
    });

    describe("comment detection", () => {
        it("recognizes multiline comments on their own lines", () => {
            let expected = {testClass: {values: [0, 1]}};

            let testString = `
/*
multiline
comment
*/
class testClass {
    values[] = {0,1};
};`;

            let result = parse(testString);
            expect(expected).toEqual(result);
        });
        it("recognizes line comments on their own lines", () => {
            expect(parse("// foo comment")).toEqual({});
            expect(parse("// foo comment\nx=2;")).toEqual({x: 2});
        });
        it("recognizes line comments at the end of a line", () => {
            expect(parse("x=2;// foo comment")).toEqual({x: 2});
            expect(parse("class Moo { // foo comment\n};")).toEqual({Moo: {}});
        });
        it("detects inline comments between property name and value", () => {
            expect(parse("class X {foo/*comment*/=42;};")).toEqual({X: {foo:42}});
            expect(parse("class X {foo=/*comment*/42;};")).toEqual({X: {foo:42}});
        });
        it("fails on invalid shit with broken comment syntax", () => {
            expect(() => parse("class X {foo///=42;};")).toThrow();
            expect(() => parse("class X {foo/*/=42;};")).toThrow();
        });
    });

    it("can handle escaped quotes", function () {
        expect(parse('foo="bar ""haha"";";\n')).toEqual({foo: 'bar "haha";'});
    });

    it("mission report", function() {

        let expected = {
            "Session": {
                "Player1": {
                    "customScore": 0,
                    "killed": 0,
                    "killsAir": 0,
                    "killsArmor": 0,
                    "killsInfantry": 4,
                    "killsPlayers": 0,
                    "killsSoft": 0,
                    "killsTotal": 4,
                    "name": "Lord DK"
                },
                "Player2": {
                    "customScore": 0,
                    "killed": 0,
                    "killsAir": 0,
                    "killsArmor": 0,
                    "killsInfantry": 3,
                    "killsPlayers": 0,
                    "killsSoft": 0,
                    "killsTotal": 3,
                    "name": "XiviD"
                },
                "Player3": {
                    "customScore": 0,
                    "killed": 0,
                    "killsAir": 0,
                    "killsArmor": 0,
                    "killsInfantry": 2,
                    "killsPlayers": 0,
                    "killsSoft": 0,
                    "killsTotal": 2,
                    "name": "40mm2Die"
                },
                "Player4": {
                    "customScore": 0,
                    "killed": 0,
                    "killsAir": 0,
                    "killsArmor": 0,
                    "killsInfantry": 4,
                    "killsPlayers": 0,
                    "killsSoft": 0,
                    "killsTotal": 4,
                    "name": "WickerMan"
                },
                "Player5": {
                    "customScore": 0,
                    "killed": 1,
                    "killsAir": 0,
                    "killsArmor": 0,
                    "killsInfantry": 3,
                    "killsPlayers": 0,
                    "killsSoft": -1,
                    "killsTotal": 1,
                    "name": "Fusselwurm"
                },
                "Player6": {
                    "customScore": 0,
                    "killed": 0,
                    "killsAir": 0,
                    "killsArmor": 0,
                    "killsInfantry": 0,
                    "killsPlayers": 0,
                    "killsSoft": 0,
                    "killsTotal": 0,
                    "name": "Simmax"
                },
                "Player7": {
                    "customScore": 0,
                    "killed": 2,
                    "killsAir": 0,
                    "killsArmor": 0,
                    "killsInfantry": 0,
                    "killsPlayers": 0,
                    "killsSoft": 0,
                    "killsTotal": 0,
                    "name": "Andre"
                },
                "duration": 5821.1724,
                "gameType": "Coop",
                "island": "Altis",
                "mission": "W-CO@10 StealBoot v03"
            }
        };

        let result = parse("\n\tclass Session\n\t{\n\tmission=\"W-CO@10 StealBoot v03\";\n\tisland=\"Altis\";\n\t" +
            "gameType=\"Coop\";\n\tduration=5821.1724;\n\tclass Player1\n\t{\n\tname=\"Lord DK\";\n\tkillsInfantry=4;\n\t" +
            "killsSoft=0;\n\tkillsArmor=0;\n\tkillsAir=0;\n\tkillsPlayers=0;\n\tcustomScore=0;\n\tkillsTotal=4;\n\tkilled=0;" +
            "\n\t};\n\tclass Player2\n\t{\n\tname=\"XiviD\";\n\tkillsInfantry=3;\n\tkillsSoft=0;\n\tkillsArmor=0;\n\tkillsAir=0;" +
            "\n\tkillsPlayers=0;\n\tcustomScore=0;\n\tkillsTotal=3;\n\tkilled=0;\n\t};\n\t" +
            "class Player3\n\t{\n\tname=\"40mm2Die\";\n\tkillsInfantry=2;\n\tkillsSoft=0;\n\tkillsArmor=0;\n\tkillsAir=0;" +
            "\n\tkillsPlayers=0;\n\tcustomScore=0;\n\tkillsTotal=2;\n\tkilled=0;\n\t};\n\t" +
            "class Player4\n\t{\n\tname=\"WickerMan\";\n\tkillsInfantry=4;\n\tkillsSoft=0;\n\tkillsArmor=0;\n\tkillsAir=0;" +
            "\n\tkillsPlayers=0;\n\tcustomScore=0;\n\tkillsTotal=4;\n\tkilled=0;\n\t};\n\t" +
            "class Player5\n\t{\n\tname=\"Fusselwurm\";\n\tkillsInfantry=3;\n\tkillsSoft=-1;\n\tkillsArmor=0;\n\tkillsAir=0;" +
            "\n\tkillsPlayers=0;\n\tcustomScore=0;\n\tkillsTotal=1;\n\tkilled=1;\n\t};\n\t" +
            "class Player6\n\t{\n\tname=\"Simmax\";\n\tkillsInfantry=0;\n\tkillsSoft=0;\n\tkillsArmor=0;\n\tkillsAir=0;" +
            "\n\tkillsPlayers=0;\n\tcustomScore=0;\n\tkillsTotal=0;\n\tkilled=0;\n\t};\n\t" +
            "class Player7\n\t{\n\tname=\"Andre\";\n\tkillsInfantry=0;\n\tkillsSoft=0;\n\tkillsArmor=0;\n\tkillsAir=0;" +
            "\n\tkillsPlayers=0;\n\tcustomScore=0;\n\tkillsTotal=0;\n\tkilled=2;\n\t};\n\t};\n\n\t");

        expect(result).toEqual(expected);
    });

    it("supports multiline init expressions created by editor", function () {
        const source =  `class Item0 {
	  position[]={1954.6425,5.9796591,5538.1045};
	  id=0;
	  init="[this, ""Platoon""] call FP_fnc_setVehicleName;" \\n "if (isServer) then {" \\n "  [this] call FP_fnc_clearVehicle; this addWeaponCargoGlobal [""CUP_launch_M136"", 1];" \\n "  this addMagazineCargoGlobal [""1Rnd_HE_Grenade_shell"", 10];" \\n "  this addMagazineCargoGlobal [""ATMine_Range_Mag"", 6];" \\n "};";
};`;
        let result = parse(source);
        let expected = {
            Item0: {
                position: [1954.6425, 5.9796591, 5538.1045],
                id: 0,
                init: '[this, "Platoon"] call FP_fnc_setVehicleName;\nif (isServer) then {\n  [this] call FP_fnc_clearVehicle; this addWeaponCargoGlobal ["CUP_launch_M136", 1];\n  this addMagazineCargoGlobal ["1Rnd_HE_Grenade_shell", 10];\n  this addMagazineCargoGlobal ["ATMine_Range_Mag", 6];\n};'
            }
        };

        expect(result).toEqual(expected);
    });

    describe("handling translation strings", () => {
        it("uses translation key if specific translation is missing", () => {
            const expected = {
                testClass: {
                    title: "Test Class",
                    values: [0, 1],
                    texts: ["STR_UNTRANSLATED", "Translated text"],
                    default: 1
                }
            };

            const testString = "class testClass {\n\ttitle = $STR_CLASS_TITLE;\n\tvalues[] = {0,1};\n\ttexts[] = {$STR_UNTRANSLATED, $STR_TRANSLATED};\n\tdefault = 1;\n};";

            const result = parse(testString, {
                translations: {
                    STR_CLASS_TITLE: 'Test Class',
                    STR_TRANSLATED: 'Translated text'
                }
            });

            expect(result).toEqual(expected);
        });
        it("uses translation key if no translations are given", () => {
            const expected = {
                testClass: {
                    text: "STR_UNTRANSLATED",
                }
            };

            const testString = "class testClass { text = $STR_UNTRANSLATED;};";

            expect(parse(testString, {})).toEqual(expected);
            expect(parse(testString)).toEqual(expected);
        });
        it("ignores whitespace after translation key", () => {
            const expected = {
                testClass: {
                    title: "Translated title",
                    texts: ["Translated text"],
                }
            };

            const testString = "class testClass {\n\ttitle = $STR_CLASS_TITLE ;\n\ttexts[] = {$STR_CLASS_TEXT };};";

            const result = parse(testString, {
                translations: {
                    STR_CLASS_TITLE: 'Translated title',
                    STR_CLASS_TEXT: 'Translated text'
                }
            });

            expect(result).toEqual(expected);

        });
        it("fails if whitespace found *within* translation key (simple property)", () => {
            const testString = "class testClass {\n\ttitle = $STR_CLA SS_TITLE;\n\ttexts[] = {$STR_CLASS_TEXT};};";

            expect(() => parse(testString, {
                translations: {
                    STR_CLASS_TITLE: 'Translated title',
                    STR_CLASS_TEXT: 'Translated text'
                }
            })).toThrow();
        });

        it("fails if whitespace found *within* translation key (array)", () => {
            const testString = "class testClass {\n\ttitle = $STR_CLASS_TITLE;\n\ttexts[] = {$STR_CLA SS_TEXT};};";

            expect(() => parse(testString, {
                translations: {
                    STR_CLASS_TITLE: 'Translated title',
                    STR_CLASS_TEXT: 'Translated text'
                }
            })).toThrow();
        });
        it("fails with exception on EOF within translation key", () => {
            const testString = "class testClass{ title = $STR_CLASS_TIT";

            expect(() => parse(testString)).toThrow();
        });
    });
    describe("delete", () => {
        it("is rejected without name", () => {
            const testString = "class testClass { delete; }; "
            expect(() => parse(testString)).toThrow();
        });
        it("ignores delete statements", () => {
            const testString = "class testClass { delete Foo; };";
            expect(parse(testString)).toEqual({testClass: {}});
        });
    });
    describe("import", () => {
        it("is rejected without name", () => {
            const testString = "class testClass { import; }; "
            expect(() => parse(testString)).toThrow();
        });
        describe("is ignored", () => {
            it("within classes", () => {
                const testString = "class testClass { import Foo; };"
                expect(parse(testString)).toEqual({testClass: {}});
            });
            it("at start of file", () => {
                const testString = "import Foo; class testClass {};"
                expect(parse(testString)).toEqual({testClass: {}});
            });
        });
    });
    describe("import … from …", () => {
        it("is rejected without name", () => {
            const testString = "class testClass { import Foo from; }; "
            expect(() => parse(testString)).toThrow();
        });
        describe("is ignored", () => {
            it("within classes", () => {
                const testString = "class testClass { import Foo from Bar; };"
                expect(parse(testString)).toEqual({testClass: {}});
            });
            it("at start of file", () => {
                const testString = "import Foo from Bar; class testClass {};"
                expect(parse(testString)).toEqual({testClass: {}});
            });
        });
    });

    describe("weird shit: ", () => {
        it("unquoted array element as string: ", () => {
            const testString = "y[] = {[};";
            expect(parse(testString)).toEqual({y: ["["]});
        })
    })
});
