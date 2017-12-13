type boolInt = 0|1;

interface SqmArray<T> {
    items: number
    [ItemX: string]: T|number|Function
}

interface SqmEntity {
    dataType: string
    name: string
    id: number
    atlOffset: number
    CustomAttributes?: any
    Entities?: SqmArray<SqmEntity>
}

class SqmArrayAccess<T> {
    private items: T[] = [];
    constructor(arr: SqmArray<T>) {
        for (let i = 0; i < arr.items; i++) {
            this.items.push(arr["Item" + i] as T);
        }
    }

    toArray(): T[] {
        return this.items.slice();
    }
}



interface Sqm {
    version: number
    EditorData: any
    binarizationWanted: boolInt
    addons: string[]
    AddonsMetaData: any
    randomSeed: number
    ScenarioData: {
        author: string
    }
    CustomAttributes: any
    Mission: {
        Intel: any
        Entities: SqmArray<SqmEntity>
        Connections: any
    }
}

function getSlotsFromMissionSqm(missionSqm: Sqm) {
    const entities: SqmEntity[] = (new SqmArrayAccess(missionSqm.Mission.Entities)).toArray()
    console.log(entities.map(() => null))
}
