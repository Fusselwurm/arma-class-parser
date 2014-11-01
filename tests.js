QUnit.test("parser exists", function(assert) {
    assert.equal(typeof window.parse, 'function');
});

QUnit.test("empty object", function(assert) {

    var expected = {Moo: {}};
    var result = window.parse('class Moo {};');

    assert.deepEqual(result, expected);
});


QUnit.test("integer property", function(assert) {

    var expected = {
        Moo: {
            value: 1
        }
    };
    var result = window.parse('class Moo {\r\nvalue=1; };');

    assert.deepEqual(result, expected);
});

QUnit.test("more than one value in file", function (assert) {
    var expected = {
        version: 12,
        Moo: {
            value: 1
        }
    };

    var result = window.parse('version=12;\n\nclass Moo  {\r\n value = 1; };');

    assert.deepEqual(result, expected);
});

QUnit.test("array of scalars", function (assert) {
    var expected = {
        Moo: {
            foo: ['bar', 'baz', 1.5e2]
        }
    };

    var result = window.parse('class Moo {\r\nfoo[]={"bar", "baz",1.5e2}; };');

    assert.deepEqual(result, expected);
});

QUnit.test("scientific notation", function (assert) {
    assert.deepEqual(parse("x=-1.5e2;"), {x: -1.5e2});
});

QUnit.test("simple arithmetic", function (assert) {
   assert.deepEqual(parse("x=48+0x800;"), {x: 48 + 0x800});
});

QUnit.test("line comments", function (assert) {

    assert.deepEqual(parse("// foo comment"), {});
    assert.deepEqual(parse("// foo comment\nx=2;"), {x: 2});
    assert.deepEqual(parse("x=2;// foo comment"), {x: 2});
    assert.deepEqual(parse("class Moo { // foo comment\n};"), {Moo: {}});

});

QUnit.test("quote escaping by double quote -.-", function (assert) {
   assert.deepEqual(parse('foo="bar ""haha"";";\n'), {foo: 'bar "haha";'});
});

QUnit.test("mission report", function(assert) {

    var expected = {
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

    var result = window.parse("\n\tclass Session\n\t{\n\tmission=\"W-CO@10 StealBoot v03\";\n\tisland=\"Altis\";\n\t" +
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

    assert.deepEqual(result, expected);
});

