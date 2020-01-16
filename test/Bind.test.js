import React from 'react';
import { mount } from 'enzyme';

import ViewModel, { ViewController, Bind } from '../src';

const valueTester = want => 
    jest.fn(have => {
        expect(have).toEqual(want);
    });

describe("Bind component", () => {
    describe("with valid bindings", () => {
        // eslint-disable-next-line jest/expect-expect
        test("it should allow binding to ViewModel keys", () => {
            const data = {
                foo: 'bar',
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
        });
    
        test("it should allow binding to ViewController", () => {
            let bound, controller;
        
            mount(
                <ViewController>
                    <Bind controller>
                        { (props, vc) => {
                            bound = props;
                            controller = vc;
                        }}
                    </Bind>
                </ViewController>
            );
        
            expect(bound).toEqual({});
            expect(Object.keys(controller)).toEqual(['$get', '$set', '$dispatch']);
            expect(typeof controller.$get).toBe('function');
            expect(typeof controller.$set).toBe('function');
            expect(typeof controller.$dispatch).toBe('function');
        });
    });
    
    describe("binding validation", () => {
        const oldConsoleError = console.error;
        
        beforeAll(() => {
            console.error = () => {};
        });
        
        afterAll(() => {
            console.error = oldConsoleError;
        });
        
        test("it should throw on invalid binding", () => {
            expect(() => {
                mount(
                    <Bind props={{ value: true }}>
                        { null }
                    </Bind>
                );
            }).toThrow('Invalid bound prop definition');
        });
        
        test("it should throw if key is not specified", () => {
            expect(() => {
                mount(
                    <Bind props={[{ prop: "value" }]}>
                        { null }
                    </Bind>
                );
            }).toThrow("The 'key' field is required for a binding: " +
                       '{"prop":"value"}');
        });
        
        test("it should throw on invalid formula", () => {
            expect(() => {
                mount(
                    <Bind props={[{ key: 'boo', formula: [] }]}>
                        { null }
                    </Bind>
                );
            }).toThrow('Invalid formula definition: []');
        });
        
        test("it should throw when 'publish' property is invalid", () => {
            expect(() => {
                mount(
                    <Bind props={[{ key: 'faa', publish: 'jickle' }]} />
                );
            }).toThrow(`Invalid publish value: "jickle". Should be 'true' or 'false'.`);
        });
        
        test("it should throw when publishing Symbol key without setterName", () => {
            expect(() => {
                const sym = Symbol('voo');
                
                mount(
                    <Bind props={{
                            value: {
                                key: sym,
                                publish: true,
                            }
                        }}>
                        { null }
                    </Bind>
                );
            }).toThrow('Setter function name is required for publishing Symbol keys ' +
                       'in a ViewModel. Published key: Symbol(voo)');
        });
    });
});
