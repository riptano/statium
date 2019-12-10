import React from 'react';
import { mount } from 'enzyme';
import sleep from './sleep';

import ViewModel, { Bind } from '../src';
import { accessorType } from '../src/accessors.js';

const valueTester = want => 
    jest.fn(have => {
        expect(have).toEqual(want);
    });

describe("accessors", () => {
    const oldConsoleError = console.error;

    beforeAll(() => {
        console.error = () => {};
    });

    afterAll(() => {
        console.error = oldConsoleError;
    });
    
    describe("root accessor error handling", () => {
        describe("development", () => {
            test("trying to get a value should throw an exception", () => {
                expect(() => {
                    mount(
                        <Bind props="foo">
                            { () => null }
                        </Bind>
                    );
                }).toThrow('Failed to retrieve a value for key "foo", no ViewModel found');
            });
    
            test("trying to set a value should throw an exception", () => {
                let setter;
        
                mount(
                    <Bind controller>
                        { (_, { $set }) => {
                            setter = $set;
                        }}
                    </Bind>
                );
        
                expect(() => {
                    setter("bar", { blerg: "bonz" });
                }).toThrow('Failed to set key "bar", no ViewModel found. Value: {"blerg":"bonz"}');
            });
        });
    
        describe("production", () => {
            const oldEnv = process.env.NODE_ENV;
            let error;
        
            beforeAll(() => {
                process.env.NODE_ENV = 'production';
                console.error = err => { error = err; };
            });
        
            afterAll(() => {
                process.env.NODE_ENV = oldEnv;
            });
        
            beforeEach(() => {
                error = null;
            });
        
            test("trying to get a value should print an error but NOT throw an exception", () => {
                expect(() => {
                    mount(
                        <Bind props="plugh">
                            { () => null }
                        </Bind>
                    );
                }).not.toThrow();
            
                expect(error).toBe('Failed to retrieve a value for key "plugh", no ViewModel found');
            });
    
            test("trying to set a value should print an error but NOT throw an exception", () => {
                let setter;
            
                mount(
                    <Bind controller>
                        { (_, { $set }) => {
                            setter = $set;
                        }}
                    </Bind>
                );
        
                expect(() => {
                    setter("klutz", { throbbe: "zingbong" });
                }).not.toThrow();
            
                expect(error).toBe('Failed to set key "klutz", no ViewModel found. Value: {"throbbe":"zingbong"}');
            });
        });
    });
    
    describe("getters", () => {
        describe("called with one key, as used in ViewModel", () => {
            test("a getter should retrieve own data value", () => {
                const data = { uyun: "pewm" };
                const tester = valueTester(data);
            
                mount(
                    <ViewModel data={data}>
                        <Bind props="uyun">
                            { tester }
                        </Bind>
                    </ViewModel>
                );
            
                expect(tester).toHaveBeenCalled();
            });
        
            test("a getter should retrieve own state value", async () => {
                let value, setter;
            
                mount(
                    <ViewModel initialState={{ woom: "knurgle" }}>
                        <Bind props={[['woom', true]]}>
                            { ({ woom, setWoom }) => {
                                value = woom;
                                setter = setWoom;
                            }}
                        </Bind>
                    </ViewModel>
                );
            
                expect(value).toBe("knurgle");
            
                await setter("muux");
            
                expect(value).toBe("muux");
            });
        
            test("a getter should retrieve parent data value", () => {
                const data = { quarck: "oonz" };
                const tester = valueTester(data);
            
                mount(
                    <ViewModel data={data}>
                        <ViewModel data={{ glurk: "bork" }}>
                            <Bind props="quarck">
                                { tester }
                            </Bind>
                        </ViewModel>
                    </ViewModel>
                );
            
                expect(tester).toHaveBeenCalled();
            });
        
            test("a getter should retrieve parent state value", async () => {
                let value, setter;
            
                mount(
                    <ViewModel initialState={{ yapp: "tink" }}>
                        <ViewModel>
                            <Bind props={[['yapp', true]]}>
                                { ({ yapp, setYapp }) => {
                                    value = yapp;
                                    setter = setYapp;
                                }}
                            </Bind>
                        </ViewModel>
                    </ViewModel>
                );
            
                expect(value).toBe("tink");
            
                await setter("dutze");
            
                expect(value).toBe("dutze");
            });
        
            test("a getter should support Symbol keys", () => {
                const sym = Symbol('krackle');
                const data = { [sym]: "aoum" };
                const tester = valueTester(data);
            
                mount(
                    <ViewModel data={data}>
                        <Bind props={sym}>
                            { tester }
                        </Bind>
                    </ViewModel>
                );
            
                expect(tester).toHaveBeenCalled();
            });
        
            test("a getter should retrieve value with deep key selector", () => {
                const data = {
                    smoo: {
                        juff: {
                            kranz: {
                                umble: "lamn",
                            },
                        },
                    },
                };
            
                const tester = valueTester({ value: "lamn" });
            
                mount(
                    <ViewModel data={data}>
                        <Bind props={{ value: "smoo.juff.kranz.umble" }}>
                            { tester }
                        </Bind>
                    </ViewModel>
                );
            
                expect(tester).toHaveBeenCalled();
            });
        });
    });
    
    describe("formulas", () => {
        describe("defined in ViewModel", () => {
            test("a formula should be passed a getter when executed", () => {
                let getter;
                
                mount(
                    <ViewModel formulas={{ getz: $get => $get }}>
                        <Bind props="getz">
                            { ({ getz }) => {
                                getter = getz;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                expect(typeof getter).toBe('function');
                expect(getter[accessorType]).toBe('retrieve');
            });
            
            test("formula execution result should be passed as bound value", () => {
                const tester = valueTester({ gurgle: 66 });
                
                mount(
                    <ViewModel data={{ brumble: 42 }}
                        formulas={{ gurgle: $get => $get('brumble') + 24 }}>
                        <Bind props="gurgle">
                            { tester }
                        </Bind>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
            
            test("formula can depend on another formula", () => {
                const tester = valueTester({ moow: 123 });
                
                mount(
                    <ViewModel data={{ ktuf: 100 }}
                        formulas={{
                            qrux: $get => $get('ktuf') + 11,
                            moow: $get => $get('qrux') + 12,
                        }}>
                        <Bind props="moow">
                            { tester }
                        </Bind>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
            
            test("formula should be executed on each binding read", async () => {
                const values = [];
                let setter;
                
                mount(
                    <ViewModel initialState={{ counter: 0 }}
                        formulas={{ 'geiger++': $get => $get('counter') + 1, }}>
                        <Bind props={{
                                formulaValue: { key: 'geiger++' },
                                counter: { key: 'counter', publish: true }
                            }}>
                            { ({ formulaValue, setCounter }) => {
                                values.push(formulaValue);
                                setter = setCounter;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                await setter(10);
                
                expect(values).toEqual([1, 11]);
            });
            
            test("a formula should support Symbol keys", () => {
                const sym = Symbol('muckle');
                const data = { purgle: "yeck" };
                const tester = valueTester({ [sym]: "yeck" });
            
                mount(
                    <ViewModel data={data} formulas={{ [sym]: $get => $get('purgle') }}>
                        <Bind props={sym}>
                            { tester }
                        </Bind>
                    </ViewModel>
                );
            
                expect(tester).toHaveBeenCalled();
            });
        });
        
        describe("inlined in bound props", () => {
            const pi = 3.14;
            const data = { radius: 100 };
            
            test("it should work as expected", () => {
                const tester = valueTester({ length: 628 });
        
                mount(
                    <ViewModel data={data}>
                        <Bind props={{
                                length: $get => Math.floor(pi * 2 * $get('radius')),
                            }}>
                            { tester }
                        </Bind>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
            
            test("it should support Symbol keys", () => {
                const sym = Symbol('area');
                const tester = valueTester({ [sym]: 31400 });
                
                mount(
                    <ViewModel data={data}>
                        <Bind props={{
                                [sym]: $get => pi * ($get('radius') * $get('radius'))
                            }}>
                            { tester }
                        </Bind>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
        });
    });
    
    describe("setters", () => {
        test("trying to bind a setter for data key should throw exception", () => {
            expect(() => {
                mount(
                    <ViewModel data={{ aegh: "jimp" }} initialState={{ wekk: "ippu" }}>
                        <Bind props={[['wekk', true], ['aegh', true]]} />
                    </ViewModel>
                );
            }).toThrow('Setting read-only key "aegh" is not allowed.');
        });
        
        test("it should set value for own key defined in initialState", async () => {
            const values = {};
            
            mount(
                <ViewModel initialState={{ jakk: "chung" }}>
                    <Bind props={[{ prop: 'jakk', key: 'jakk', publish: true }]}>
                        { bound => { Object.assign(values, bound); }}
                    </Bind>
                </ViewModel>
            );
            
            expect(values.jakk).toBe('chung');
            expect(typeof values.setJakk).toBe('function');
            
            await values.setJakk('mung');
            
            expect(values.jakk).toBe('mung');
            expect(typeof values.setJakk).toBe('function');
        });
        
        test("it should allow setting a key in inherited state", async () => {
            const values = {};
            
            mount(
                <ViewModel initialState={{ durg: "wuygu" }}>
                    <div>
                        <ViewModel initialState={{ aummo: "roiq" }}>
                            <div>
                                <Bind props={[
                                        { prop: 'value', key: 'durg', publish: true }
                                    ]}>
                                    { bound => { Object.assign(values, bound); }}
                                </Bind>
                            </div>
                        </ViewModel>
                    </div>
                </ViewModel>
            );
        
            expect(values.value).toBe('wuygu');
            expect(typeof values.setValue).toBe('function');
        
            await values.setValue('klatz');
            
            expect(values.value).toBe('klatz');
            expect(typeof values.setValue).toBe('function');
        });
        
        test("it should support setting a value with deep key selector", async () => {
            const values = {};
            const data = {
                donk: {
                    yitt: {
                        vix: {
                            qwut: "kloo",
                        },
                    },
                },
            };
            
            mount(
                <ViewModel initialState={data}>
                    <Bind props={[{
                            prop: 'cuong', key: 'donk',
                        }, {
                            prop: 'eurg', key: 'donk.yitt.vix.qwut', publish: true
                        }]}>
                        { bound => { Object.assign(values, bound); }}
                    </Bind>
                </ViewModel>
            );
            
            expect(values.cuong).toEqual(data.donk);
            expect(values.eurg).toBe('kloo');
            expect(typeof values.setEurg).toBe('function');
            
            const oldCuong = values.cuong;
            
            await values.setEurg('grax');
            
            const want = {
                yitt: {
                    vix: {
                        qwut: "grax",
                    },
                },
            };
            
            expect(values.cuong === oldCuong).toBe(false);
            expect(values.cuong).toEqual(want);
            expect(values.eurg).toBe('grax');
            expect(typeof values.setEurg).toBe('function');
        });
        
        test("setting state should work after parent component re-mount", async () => {
            const data = { pharg: "nix" };
            const values = {};
            
            const tree = mount(
                <ViewModel data={data} initialState={{ vroom: "qrux" }}>
                    <Bind props={{
                            value: {
                                key: "vroom",
                                publish: true
                            },
                            pharg: "pharg",
                        }}>
                        { bound => { Object.assign(values, bound); }}
                    </Bind>
                </ViewModel>
            );
            
            expect(values.pharg).toBe("nix");
            expect(values.value).toBe("qrux");
            expect(typeof values.setValue).toBe('function');
            
            data.pharg = "nux";
            tree.mount();
            
            await sleep();
            
            expect(values.pharg).toBe("nux");
            expect(values.value).toBe("qrux");
            expect(typeof values.setValue).toBe('function');
            
            expect(() => {
                values.setValue("brak");
            }).not.toThrow();
            
            await sleep();
            
            expect(values.pharg).toBe("nux");
            expect(values.value).toBe("brak");
            expect(typeof values.setValue).toBe('function');
        });
        
        test("it should allow setting a value for Symbol key", async () => {
            const sym = Symbol('foofle');
            let result, setter;
    
            mount(
                <ViewModel initialState={{ [sym]: "krabble" }}>
                    <Bind props={{
                            value: { key: sym, publish: true, setterName: 'setValue' }
                        }}>
                        { ({ value, setValue }) => {
                            result = value;
                            setter = setValue;
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(result).toBe("krabble");
            
            await setter(["kribble"]);
            
            expect(result).toEqual(["kribble"]);
        });
    });
});
