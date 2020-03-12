import React from 'react';
import { mount } from 'enzyme';

import ViewModel, { withBindings } from '../src';

describe('withBindings HOC', () => {
    test('it should return a valid wrapped component', () => {
        const Component = withBindings()(() => <div>foo</div>);

        const tree = mount(<Component />);

        expect(tree).toMatchInlineSnapshot(`
            <ComponentWithBindings>
              <Component>
                <div>
                  foo
                </div>
              </Component>
            </ComponentWithBindings>
        `);
    });
    
    test("variadic arguments should work", () => {
        let values;
        
        const Component = ({ kramble, xyyf }) => {
            values = { kramble, xyyf };
            
            return null;
        };
        
        const BoundComponent = withBindings('kramble', 'xyyf')(Component);
        
        mount(
            <ViewModel data={{ kramble: "dhak", xyyf: "ongo" }}>
                <BoundComponent />
            </ViewModel>
        );
        
        expect(values).toEqual({ kramble: "dhak", xyyf: "ongo" });
    });
});
