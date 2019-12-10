import React from 'react';
import { mount } from 'enzyme';
import sleep from './sleep';

import ViewModel, { Bind } from '../src';
import { accessorType } from '../src/accessors.js';

const valueTester = want => 
    jest.fn(have => {
        expect(have).toEqual(want);
    });

describe("ViewModel component", () => {
    const oldConsoleError = console.error;
    
    beforeAll(() => {
        console.error = () => {};
    });
    
    afterAll(() => {
        console.error = oldConsoleError;
    });
    
    describe("data", () => {
        describe("own", () => {
            test("ViewModel should allow binding to own data", () => {
                const data = {
                    foo: 'bar'
                };
                
                const tester = valueTester(data);
                
                mount(
                    <ViewModel data={data}>
                        <div>
                            <Bind props="foo">
                                { tester }
                            </Bind>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
        });
        
        describe("hierarchical", () => {
            test("ViewModel should allow binding to inherited data", () => {
                const tester = valueTester({
                    bar: 'baz',
                    qux: 'moof',
                });
                
                mount(
                    <ViewModel data={{ bar: 'baz' }}>
                        <div>
                            <ViewModel data={{ qux: 'moof' }}>
                                <div>
                                    <Bind props={['bar', 'qux']}>
                                        { tester }
                                    </Bind>
                                </div>
                            </ViewModel>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
        });
    });
    
    describe("state", () => {
        describe("initializing", () => {
            test("ViewModel should allow initializing state with an object", () => {
                const tester = valueTester({ blerg: 'knurf' });
                
                mount(
                    <ViewModel initialState={{ blerg: 'knurf' }}>
                        <div>
                            <Bind props="blerg">
                                { tester }
                            </Bind>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
            
            test("ViewModel should allow initializing state with a function", () => {
                const tester = valueTester({ hloom: 'kazoo' });
                
                mount(
                    <ViewModel initialState={() => ({ hloom: "kazoo" })}>
                        <div>
                            <Bind props="hloom">
                                { tester }
                            </Bind>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
            
            test("ViewModel should pass multi-getter to initialState function", () => {
                let values;
                
                mount(
                    <ViewModel data={{ krabbe: "dunz", byrge: "aax", }}>
                        <ViewModel initialState={$get => {
                            values = $get('krabbe', 'byrge');
                            
                            return {};
                        }} />
                    </ViewModel>
                );
                
                expect(values).toEqual(['dunz', 'aax']);
            });
            
            test("ViewModel should throw an exception on invalid initialState", () => {
                expect(() => {
                    mount(
                        <ViewModel initialState={null} />
                    );
                }).toThrow(`Invalid initialState: null`);
            });
        });
        
        // Getting own state is pretty much covered in "initializing" block above
        describe("getting", () => {
            describe("inherited state", () => {
                test("ViewModel should allow getting inherited state", () => {
                    const tester = valueTester({
                        gurgle: 'throbbe',
                        mymse: 'puxx',
                    });
                
                    mount(
                        <ViewModel initialState={{ gurgle: "throbbe" }}>
                            <div>
                                <ViewModel initialState={() => ({ mymse: "puxx" })}>
                                    <div>
                                        <Bind props={['gurgle', 'mymse']}>
                                            { tester }
                                        </Bind>
                                    </div>
                                </ViewModel>
                            </div>
                        </ViewModel>
                    );
                
                    expect(tester).toHaveBeenCalled();
                });
            });
        });
        
        describe("modifying", () => {
            test("ViewModel should call applyState modifier on rendering", () => {
                let state, getter, values, result;
                
                const applier = jest.fn((currentState, $get) => {
                    state = currentState;
                    getter = $get;
                    
                    values = $get('kunwa', 'mombo');
                    
                    return {
                        opptu: ["durp"],
                        fugh: "quipple",
                        runk: $get('kunwa'),
                    };
                });
                
                mount(
                    <ViewModel data={{ kunwa: "tyxi", mombo: "qwee" }}
                        initialState={{ opptu: "yarf" }}
                        applyState={applier}>
                        <Bind props={["kunwa", "opptu", "fugh", "runk"]}>
                            { values => {
                                result = values;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                expect(state).toEqual({
                    opptu: "yarf",
                });
                
                expect(typeof getter).toBe('function');
                expect(getter[accessorType]).toBe('get');
                
                expect(values).toEqual(['tyxi', 'qwee']);
                
                expect(result).toEqual({
                    kunwa: "tyxi",
                    opptu: ["durp"],
                    fugh: "quipple",
                    runk: "tyxi",
                });
            });
        });
        
        describe("observing", () => {
            test("ViewModel should not call observeStateChange on initial rendering", () => {
                const observer = jest.fn();
                let result;
                
                mount(
                    <ViewModel initialState={{ durg: "jmoo" }} observeStateChange={observer}>
                        <Bind props="durg">
                            { values => {
                                result = values;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                expect(result).toEqual({
                    durg: "jmoo",
                });
                
                expect(observer).not.toHaveBeenCalled();
            });
            
            test("ViewModel should call observeStateChange handler on state change", async () => {
                let result, setter, args;
                
                const observer = jest.fn((...params) => { args = params; });
                
                mount(
                    <ViewModel data={{ bunz: "krunz" }}
                        initialState={{ hfou: "zitz" }}
                        observeStateChange={observer}>
                        
                        <Bind props={{ value: { key: "hfou", publish: true }}}>
                            { ({ value, setValue }) => {
                                result = value;
                                setter = setValue;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                await setter("vroom");
                
                expect(result).toBe("vroom");
                expect(observer).toHaveBeenCalled();
                expect(args).toEqual([{
                    bunz: "krunz",
                    hfou: "vroom",
                }]);
            });
        });
    });
    
    describe("controller", () => {
        test("given controller config, should instantiate a ViewController", async () => {
            let value, dispatch;
            
            mount(
                <ViewModel initialState={{ tyuf: "krankle" }}
                    controller={{
                        handlers: {
                            event: ({ $set }, v) => { $set('tyuf', v); },
                        },
                    }}>
                    <Bind props="tyuf" controller>
                        { ({ tyuf }, { $dispatch }) => {
                            value = tyuf;
                            dispatch = $dispatch;
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(value).toBe("krankle");
            
            dispatch('event', 'nux');
            
            await sleep(10);
            
            expect(value).toBe('nux');
        });
        
        test("given protectedKeys prop but no controller config, should still instantiate a ViewController", () => {
            let result, setter;
            
            mount(
                <ViewModel initialState={{ kaffle: "durk" }} protectedKeys="kaffle">
                    <Bind props={{ value: { key: 'kaffle', publish: true }}}>
                        { ({ value, setValue }) => {
                            result = value;
                            setter = setValue;
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(result).toBe("durk");
            
            expect(() => {
                setter('cidu');
            }).toThrow('Cannot find handler for event "setKaffle". Event arguments: ["cidu"]');
        });
    });
    
    describe("protectedKeys", () => {
        let setter, result;
        
        afterEach(() => {
            setter = result = null;
        });
        
        describe("syntax", () => {
            describe("valid syntax types", () => {
                test("protected key can be a string", () => {
                    mount(
                        <ViewModel initialState={{ vurk: "yickle" }} protectedKeys="vurk">
                            <Bind props={{ value: { key: 'vurk', publish: true }}}>
                                { ({ setValue }) => {
                                    setter = setValue;
                                }}
                            </Bind>
                        </ViewModel>
                    );
            
                    expect(() => {
                        setter("burgle");
                    }).toThrow('Cannot find handler for event "setVurk". Event arguments: ["burgle"]');
                });
        
                test("protected key can be a Symbol, with specified event name", () => {
                    const sym = Symbol('ueke');
            
                    mount(
                        <ViewModel initialState={{ [sym]: "fagh" }} protectedKeys={{ [sym]: 'keueu' }}>
                            <Bind props={{ value: { key: sym, publish: true, setterName: 'setValue' }}}>
                                { ({ setValue }) => {
                                    setter = setValue;
                                }}
                            </Bind>
                        </ViewModel>
                    );
            
                    expect(() => {
                        setter({
                            hudd: "gbon"
                        });
                    }).toThrow('Cannot find handler for event "keueu". Event arguments: [{"hudd":"gbon"}]');
                });
        
                test("protected key can be a Symbol, with event name also being a Symbol", async () => {
                    const sym = Symbol('ktulu');
                    const event = Symbol('eerp');
            
                    mount(
                        <ViewModel initialState={{ [sym]: "fitz" }}
                            protectedKeys={{ [sym]: event }}
                            controller={{
                                handlers: {
                                    [event]: (vc, value) => { result = value; },
                                },
                            }}>
                            <Bind props={{ value: { key: sym, publish: true, setterName: 'setValue' }}}>
                                { ({ value, setValue }) => {
                                    result = value;
                                    setter = setValue;
                                }}
                            </Bind>
                        </ViewModel>
                    );
                    
                    setter("cyff");
                    
                    await sleep(10);
                    
                    expect(result).toBe("cyff");
                });
        
                test("protected keys can be an array", () => {
                    mount(
                        <ViewModel initialState={{ nuck: "saff" }} protectedKeys={['nuck']}>
                            <Bind props={{ nuck: { key: 'nuck', publish: true }}}>
                                { ({ setNuck }) => {
                                    setter = setNuck;
                                }}
                            </Bind>
                        </ViewModel>
                    );
            
                    expect(() => {
                        setter([0]);
                    }).toThrow('Cannot find handler for event "setNuck". Event arguments: [[0]]');
                });
        
                test("protected keys can be an object", () => {
                    mount(
                        <ViewModel initialState={{ lonto: "kuti" }} protectedKeys={{ lonto: "duff" }}>
                            <Bind props={[['lonto', true]]}>
                                { ({ setLonto }) => {
                                    setter = setLonto;
                                }}
                            </Bind>
                        </ViewModel>
                    );
            
                    expect(() => {
                        setter("ghon");
                    }).toThrow('Cannot find handler for event "duff". Event arguments: ["ghon"]');
                });
            });
            
            describe("invalid syntax", () => {
                const invalid = [undefined, null, 0, true, false, ''];
                
                // TODO Fuzzify this
                describe("simplified syntax", () => {
                    invalid.slice(2).forEach(option => {
                        test(`it should throw on ${option}`, () => {
                            expect(() => {
                                mount(
                                    <ViewModel protectedKeys={option} />
                                );
                            }).toThrow(`Invalid protected keys: ${option}`);
                        });
                    });
                    
                    test("it should throw when key is a Symbol but event is not specified", () => {
                        const sym = Symbol('kront');
                    
                        expect(() => {
                            mount(
                                <ViewModel protectedKeys={sym} />
                            );
                        }).toThrow('Protected key Symbol(kront) requires event name.');
                    });
                });
                
                describe("array syntax", () => {
                    [...invalid, []].forEach(option => {
                        test(`it should throw on invalid key ${option}`, () => {
                            expect(() => {
                                mount(
                                    <ViewModel protectedKeys={[option]} />
                                );
                            }).toThrow(`Invalid protected key: ${option}`);
                        });
                        
                        test(`it should throw on invalid key ${option} in object definition`, () => {
                            expect(() => {
                                mount(
                                    <ViewModel protectedKeys={[{ key: option }]} />
                                );
                            }).toThrow(`Invalid protected key: ${option}`);
                        });
                    });
                    
                    test("it should throw on invalid key definition (object)", () => {
                        expect(() => {
                            mount(
                                <ViewModel protectedKeys={[{ hurf: "itzo" }]} />
                            );
                        }).toThrow(`Invalid protected key entry: {"hurf":"itzo"}`);
                    });
                });
                
                describe("object syntax", () => {
                    [...invalid.slice(0, invalid.length - 1)].forEach(option => {
                        test(`it should throw on invalid event "${option}"`, () => {
                            expect(() => {
                                mount(
                                    <ViewModel protectedKeys={{ [option]: option }} />
                                );
                            }).toThrow(`Invalid event name for protected key "${option}": ${option}`);
                        });
                    });
                    
                    test("it should throw on invalid event (empty string)", () => {
                        expect(() => {
                            mount(
                                <ViewModel protectedKeys={{ funto: '' }} />
                            );
                        }).toThrow(`Invalid event name for protected key "funto": ""`);
                    });
                    
                    test("it should throw when key is a Symbol but event is not specified", () => {
                        const sym = Symbol('oof');
                    
                        expect(() => {
                            mount(
                                <ViewModel protectedKeys={[{ key: sym }]} />
                            );
                        }).toThrow('Protected key Symbol(oof) requires event name.');
                    });
                });
            });
        });
        
        describe("implementation", () => {
            test("calling a setter for protected key should fire event in own controller", async () => {
                mount(
                    <ViewModel initialState={{ utun: "riggo" }}
                        protectedKeys="utun"
                        controller={{
                            handlers: {
                                setUtun: (vc, value) => { result = value; },
                            }
                        }}>
                        <Bind props={[['utun', true]]}>
                            { ({ setUtun }) => {
                                setter = setUtun;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                setter("vackle");
                
                await sleep(10);
                
                expect(result).toBe('vackle');
            });
            
            test("calling a setter for protected key should fire event in parent controller", async () => {
                mount(
                    <ViewModel initialState={{ baff: "moow" }}
                        protectedKeys="baff"
                        controller={{
                            handlers: {
                                setBaff: (vc, value) => { result = value; },
                            },
                        }}>
                        <ViewModel initialState={{ ning: "sutt" }} controller={{}}>
                            <Bind props={[['baff', true]]}>
                                { ({ setBaff }) => {
                                    setter = setBaff;
                                }}
                            </Bind>
                        </ViewModel>
                    </ViewModel>
                );
                
                setter("junt");
                
                await sleep(10);
                
                expect(result).toBe('junt');
            });
            
            test("setting a value through controller handler should actually work", async () => {
                mount(
                    <ViewModel initialState={{ schmoo: "findus" }}
                        protectedKeys="schmoo"
                        controller={{
                            handlers: {
                                setSchmoo: ({ $set }, value) => { $set('schmoo', value); },
                            },
                        }}>
                        <Bind props={[['schmoo', true]]}>
                            { ({ schmoo, setSchmoo }) => {
                                result = schmoo;
                                setter = setSchmoo;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                expect(result).toBe("findus");
                
                setter("gurkle");
                
                await sleep(10);
                
                expect(result).toBe("gurkle");
            });
        });
    });
});
