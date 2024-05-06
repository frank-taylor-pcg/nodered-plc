
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.55.0 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[16] = list;
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[19] = list;
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (3:2) {#each state.Deck_Scan_Results || [] as container}
    function create_each_block_1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[7].call(input, /*each_value_1*/ ctx[19], /*container_index*/ ctx[20]);
    	}

    	function blur_handler() {
    		return /*blur_handler*/ ctx[8](/*container*/ ctx[18]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "element svelte-1so44k6");
    			attr_dev(input, "type", "text");
    			add_location(input, file, 3, 3, 113);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*container*/ ctx[18]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_input_handler),
    					listen_dev(input, "blur", blur_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*state*/ 1 && input.value !== /*container*/ ctx[18]) {
    				set_input_value(input, /*container*/ ctx[18]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(3:2) {#each state.Deck_Scan_Results || [] as container}",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#each state.Tray_Scan_Results || [] as tray}
    function create_each_block(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	function input_input_handler_1() {
    		/*input_input_handler_1*/ ctx[9].call(input, /*each_value*/ ctx[16], /*tray_index*/ ctx[17]);
    	}

    	function blur_handler_1() {
    		return /*blur_handler_1*/ ctx[10](/*tray*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "element svelte-1so44k6");
    			attr_dev(input, "type", "text");
    			add_location(input, file, 14, 4, 334);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*tray*/ ctx[15]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_input_handler_1),
    					listen_dev(input, "blur", blur_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*state*/ 1 && input.value !== /*tray*/ ctx[15]) {
    				set_input_value(input, /*tray*/ ctx[15]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:2) {#each state.Tray_Scan_Results || [] as tray}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div85;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let t9;
    	let textarea;
    	let t10;
    	let div84;
    	let div3;
    	let t12;
    	let div7;
    	let div4;
    	let t14;
    	let div5;
    	let t16;
    	let div6;
    	let t18;
    	let div11;
    	let div8;
    	let t19_value = /*state*/ ctx[0].Tray_Scan.Request + "";
    	let t19;
    	let t20;
    	let div9;
    	let t21_value = /*state*/ ctx[0].Tray_Scan.Complete + "";
    	let t21;
    	let t22;
    	let div10;
    	let t23_value = /*state*/ ctx[0].Tray_Scan.Acknowledge + "";
    	let t23;
    	let t24;
    	let div12;
    	let t26;
    	let div16;
    	let div13;
    	let t28;
    	let div14;
    	let t30;
    	let div15;
    	let t32;
    	let div20;
    	let div17;
    	let t33_value = /*state*/ ctx[0].Deck_Scan.Request + "";
    	let t33;
    	let t34;
    	let div18;
    	let t35_value = /*state*/ ctx[0].Deck_Scan.Complete + "";
    	let t35;
    	let t36;
    	let div19;
    	let t37_value = /*state*/ ctx[0].Deck_Scan.Acknowledge + "";
    	let t37;
    	let t38;
    	let div21;
    	let t40;
    	let div26;
    	let div22;
    	let t42;
    	let div23;
    	let t44;
    	let div24;
    	let t46;
    	let div25;
    	let t48;
    	let div31;
    	let div27;
    	let t49_value = /*state*/ ctx[0].Load_Tray.Load_Slot + "";
    	let t49;
    	let t50;
    	let div28;
    	let t51_value = /*state*/ ctx[0].Load_Tray.Request + "";
    	let t51;
    	let t52;
    	let div29;
    	let t53_value = /*state*/ ctx[0].Load_Tray.Complete + "";
    	let t53;
    	let t54;
    	let div30;
    	let t55_value = /*state*/ ctx[0].Load_Tray.Acknowledge + "";
    	let t55;
    	let t56;
    	let div32;
    	let t58;
    	let div38;
    	let div33;
    	let t60;
    	let div34;
    	let t62;
    	let div35;
    	let t64;
    	let div36;
    	let t66;
    	let div37;
    	let t68;
    	let div44;
    	let div39;
    	let t69_value = /*state*/ ctx[0].Pick_Front.Tray_Area + "";
    	let t69;
    	let t70;
    	let div40;
    	let t71_value = /*state*/ ctx[0].Pick_Front.Active_Nozzle + "";
    	let t71;
    	let t72;
    	let div41;
    	let t73_value = /*state*/ ctx[0].Pick_Front.Request + "";
    	let t73;
    	let t74;
    	let div42;
    	let t75_value = /*state*/ ctx[0].Pick_Front.Complete + "";
    	let t75;
    	let t76;
    	let div43;
    	let t77_value = /*state*/ ctx[0].Pick_Front.Acknowledge + "";
    	let t77;
    	let t78;
    	let div45;
    	let t80;
    	let div51;
    	let div46;
    	let t82;
    	let div47;
    	let t84;
    	let div48;
    	let t86;
    	let div49;
    	let t88;
    	let div50;
    	let t90;
    	let div57;
    	let div52;
    	let t91_value = /*state*/ ctx[0].Pick_Rear.Tray_Area + "";
    	let t91;
    	let t92;
    	let div53;
    	let t93_value = /*state*/ ctx[0].Pick_Rear.Active_Nozzle + "";
    	let t93;
    	let t94;
    	let div54;
    	let t95_value = /*state*/ ctx[0].Pick_Rear.Request + "";
    	let t95;
    	let t96;
    	let div55;
    	let t97_value = /*state*/ ctx[0].Pick_Rear.Complete + "";
    	let t97;
    	let t98;
    	let div56;
    	let t99_value = /*state*/ ctx[0].Pick_Rear.Acknowledge + "";
    	let t99;
    	let t100;
    	let div58;
    	let t102;
    	let div64;
    	let div59;
    	let t104;
    	let div60;
    	let t106;
    	let div61;
    	let t108;
    	let div62;
    	let t110;
    	let div63;
    	let t112;
    	let div70;
    	let div65;
    	let t113_value = /*state*/ ctx[0].Drop_Front.Destination + "";
    	let t113;
    	let t114;
    	let div66;
    	let t115_value = /*state*/ ctx[0].Drop_Front.Active_Nozzle + "";
    	let t115;
    	let t116;
    	let div67;
    	let t117_value = /*state*/ ctx[0].Drop_Front.Request + "";
    	let t117;
    	let t118;
    	let div68;
    	let t119_value = /*state*/ ctx[0].Drop_Front.Complete + "";
    	let t119;
    	let t120;
    	let div69;
    	let t121_value = /*state*/ ctx[0].Drop_Front.Acknowledge + "";
    	let t121;
    	let t122;
    	let div71;
    	let t124;
    	let div77;
    	let div72;
    	let t126;
    	let div73;
    	let t128;
    	let div74;
    	let t130;
    	let div75;
    	let t132;
    	let div76;
    	let t134;
    	let div83;
    	let div78;
    	let t135_value = /*state*/ ctx[0].Drop_Rear.Destination + "";
    	let t135;
    	let t136;
    	let div79;
    	let t137_value = /*state*/ ctx[0].Drop_Rear.Active_Nozzle + "";
    	let t137;
    	let t138;
    	let div80;
    	let t139_value = /*state*/ ctx[0].Drop_Rear.Request + "";
    	let t139;
    	let t140;
    	let div81;
    	let t141_value = /*state*/ ctx[0].Drop_Rear.Complete + "";
    	let t141;
    	let t142;
    	let div82;
    	let t143_value = /*state*/ ctx[0].Drop_Rear.Acknowledge + "";
    	let t143;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*state*/ ctx[0].Deck_Scan_Results || [];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*state*/ ctx[0].Tray_Scan_Results || [];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div85 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Reset state";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Clear log";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "Review state";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "Save state";
    			t9 = space();
    			textarea = element("textarea");
    			t10 = space();
    			div84 = element("div");
    			div3 = element("div");
    			div3.textContent = "Tray_Scan";
    			t12 = space();
    			div7 = element("div");
    			div4 = element("div");
    			div4.textContent = "Request";
    			t14 = space();
    			div5 = element("div");
    			div5.textContent = "Complete";
    			t16 = space();
    			div6 = element("div");
    			div6.textContent = "Acknowledge";
    			t18 = space();
    			div11 = element("div");
    			div8 = element("div");
    			t19 = text(t19_value);
    			t20 = space();
    			div9 = element("div");
    			t21 = text(t21_value);
    			t22 = space();
    			div10 = element("div");
    			t23 = text(t23_value);
    			t24 = space();
    			div12 = element("div");
    			div12.textContent = "Deck_Scan";
    			t26 = space();
    			div16 = element("div");
    			div13 = element("div");
    			div13.textContent = "Request";
    			t28 = space();
    			div14 = element("div");
    			div14.textContent = "Complete";
    			t30 = space();
    			div15 = element("div");
    			div15.textContent = "Acknowledge";
    			t32 = space();
    			div20 = element("div");
    			div17 = element("div");
    			t33 = text(t33_value);
    			t34 = space();
    			div18 = element("div");
    			t35 = text(t35_value);
    			t36 = space();
    			div19 = element("div");
    			t37 = text(t37_value);
    			t38 = space();
    			div21 = element("div");
    			div21.textContent = "Load_Tray";
    			t40 = space();
    			div26 = element("div");
    			div22 = element("div");
    			div22.textContent = "Load_Slot";
    			t42 = space();
    			div23 = element("div");
    			div23.textContent = "Request";
    			t44 = space();
    			div24 = element("div");
    			div24.textContent = "Complete";
    			t46 = space();
    			div25 = element("div");
    			div25.textContent = "Acknowledge";
    			t48 = space();
    			div31 = element("div");
    			div27 = element("div");
    			t49 = text(t49_value);
    			t50 = space();
    			div28 = element("div");
    			t51 = text(t51_value);
    			t52 = space();
    			div29 = element("div");
    			t53 = text(t53_value);
    			t54 = space();
    			div30 = element("div");
    			t55 = text(t55_value);
    			t56 = space();
    			div32 = element("div");
    			div32.textContent = "Pick_Front";
    			t58 = space();
    			div38 = element("div");
    			div33 = element("div");
    			div33.textContent = "Tray_Area";
    			t60 = space();
    			div34 = element("div");
    			div34.textContent = "Active_Nozzle";
    			t62 = space();
    			div35 = element("div");
    			div35.textContent = "Request";
    			t64 = space();
    			div36 = element("div");
    			div36.textContent = "Complete";
    			t66 = space();
    			div37 = element("div");
    			div37.textContent = "Acknowledge";
    			t68 = space();
    			div44 = element("div");
    			div39 = element("div");
    			t69 = text(t69_value);
    			t70 = space();
    			div40 = element("div");
    			t71 = text(t71_value);
    			t72 = space();
    			div41 = element("div");
    			t73 = text(t73_value);
    			t74 = space();
    			div42 = element("div");
    			t75 = text(t75_value);
    			t76 = space();
    			div43 = element("div");
    			t77 = text(t77_value);
    			t78 = space();
    			div45 = element("div");
    			div45.textContent = "Pick_Rear";
    			t80 = space();
    			div51 = element("div");
    			div46 = element("div");
    			div46.textContent = "Tray_Area";
    			t82 = space();
    			div47 = element("div");
    			div47.textContent = "Active_Nozzle";
    			t84 = space();
    			div48 = element("div");
    			div48.textContent = "Request";
    			t86 = space();
    			div49 = element("div");
    			div49.textContent = "Complete";
    			t88 = space();
    			div50 = element("div");
    			div50.textContent = "Acknowledge";
    			t90 = space();
    			div57 = element("div");
    			div52 = element("div");
    			t91 = text(t91_value);
    			t92 = space();
    			div53 = element("div");
    			t93 = text(t93_value);
    			t94 = space();
    			div54 = element("div");
    			t95 = text(t95_value);
    			t96 = space();
    			div55 = element("div");
    			t97 = text(t97_value);
    			t98 = space();
    			div56 = element("div");
    			t99 = text(t99_value);
    			t100 = space();
    			div58 = element("div");
    			div58.textContent = "Drop_Front";
    			t102 = space();
    			div64 = element("div");
    			div59 = element("div");
    			div59.textContent = "Destination";
    			t104 = space();
    			div60 = element("div");
    			div60.textContent = "Active_Nozzle";
    			t106 = space();
    			div61 = element("div");
    			div61.textContent = "Request";
    			t108 = space();
    			div62 = element("div");
    			div62.textContent = "Complete";
    			t110 = space();
    			div63 = element("div");
    			div63.textContent = "Acknowledge";
    			t112 = space();
    			div70 = element("div");
    			div65 = element("div");
    			t113 = text(t113_value);
    			t114 = space();
    			div66 = element("div");
    			t115 = text(t115_value);
    			t116 = space();
    			div67 = element("div");
    			t117 = text(t117_value);
    			t118 = space();
    			div68 = element("div");
    			t119 = text(t119_value);
    			t120 = space();
    			div69 = element("div");
    			t121 = text(t121_value);
    			t122 = space();
    			div71 = element("div");
    			div71.textContent = "Drop_Rear";
    			t124 = space();
    			div77 = element("div");
    			div72 = element("div");
    			div72.textContent = "Destination";
    			t126 = space();
    			div73 = element("div");
    			div73.textContent = "Active_Nozzle";
    			t128 = space();
    			div74 = element("div");
    			div74.textContent = "Request";
    			t130 = space();
    			div75 = element("div");
    			div75.textContent = "Complete";
    			t132 = space();
    			div76 = element("div");
    			div76.textContent = "Acknowledge";
    			t134 = space();
    			div83 = element("div");
    			div78 = element("div");
    			t135 = text(t135_value);
    			t136 = space();
    			div79 = element("div");
    			t137 = text(t137_value);
    			t138 = space();
    			div80 = element("div");
    			t139 = text(t139_value);
    			t140 = space();
    			div81 = element("div");
    			t141 = text(t141_value);
    			t142 = space();
    			div82 = element("div");
    			t143 = text(t143_value);
    			attr_dev(div0, "class", "region deck-wrapper svelte-1so44k6");
    			add_location(div0, file, 1, 1, 23);
    			attr_dev(div1, "class", "region column svelte-1so44k6");
    			add_location(div1, file, 12, 1, 254);
    			attr_dev(button0, "class", "svelte-1so44k6");
    			add_location(button0, file, 24, 2, 499);
    			attr_dev(button1, "class", "svelte-1so44k6");
    			add_location(button1, file, 25, 2, 547);
    			attr_dev(button2, "class", "svelte-1so44k6");
    			add_location(button2, file, 26, 2, 593);
    			attr_dev(button3, "class", "svelte-1so44k6");
    			add_location(button3, file, 27, 2, 643);
    			attr_dev(textarea, "id", "logs");
    			attr_dev(textarea, "class", "log svelte-1so44k6");
    			attr_dev(textarea, "placeholder", "Log messages...");
    			textarea.readOnly = true;
    			textarea.value = /*logs*/ ctx[1];
    			add_location(textarea, file, 28, 2, 689);
    			attr_dev(div2, "class", "region column svelte-1so44k6");
    			add_location(div2, file, 23, 1, 469);
    			attr_dev(div3, "class", "header svelte-1so44k6");
    			add_location(div3, file, 32, 2, 819);
    			attr_dev(div4, "id", "Tray_Scan.Request");
    			attr_dev(div4, "class", "subheader svelte-1so44k6");
    			add_location(div4, file, 34, 4, 880);
    			attr_dev(div5, "id", "Tray_Scan.Complete");
    			attr_dev(div5, "class", "subheader svelte-1so44k6");
    			add_location(div5, file, 35, 4, 944);
    			attr_dev(div6, "id", "Tray_Scan.Acknowledge");
    			attr_dev(div6, "class", "subheader svelte-1so44k6");
    			add_location(div6, file, 36, 4, 1010);
    			attr_dev(div7, "class", "row svelte-1so44k6");
    			add_location(div7, file, 33, 3, 858);
    			attr_dev(div8, "class", "value svelte-1so44k6");
    			add_location(div8, file, 40, 4, 1116);
    			attr_dev(div9, "class", "value svelte-1so44k6");
    			add_location(div9, file, 41, 4, 1171);
    			attr_dev(div10, "class", "value svelte-1so44k6");
    			add_location(div10, file, 42, 4, 1227);
    			attr_dev(div11, "class", "row svelte-1so44k6");
    			add_location(div11, file, 39, 3, 1094);
    			attr_dev(div12, "class", "header svelte-1so44k6");
    			add_location(div12, file, 45, 2, 1297);
    			attr_dev(div13, "class", "subheader svelte-1so44k6");
    			add_location(div13, file, 47, 4, 1358);
    			attr_dev(div14, "class", "subheader svelte-1so44k6");
    			add_location(div14, file, 48, 4, 1399);
    			attr_dev(div15, "class", "subheader svelte-1so44k6");
    			add_location(div15, file, 49, 4, 1441);
    			attr_dev(div16, "class", "row svelte-1so44k6");
    			add_location(div16, file, 46, 3, 1336);
    			attr_dev(div17, "class", "value svelte-1so44k6");
    			add_location(div17, file, 53, 4, 1520);
    			attr_dev(div18, "class", "value svelte-1so44k6");
    			add_location(div18, file, 54, 4, 1575);
    			attr_dev(div19, "class", "value svelte-1so44k6");
    			add_location(div19, file, 55, 4, 1631);
    			attr_dev(div20, "class", "row svelte-1so44k6");
    			add_location(div20, file, 52, 3, 1498);
    			attr_dev(div21, "class", "header svelte-1so44k6");
    			add_location(div21, file, 59, 2, 1728);
    			attr_dev(div22, "class", "subheader svelte-1so44k6");
    			add_location(div22, file, 61, 4, 1789);
    			attr_dev(div23, "class", "subheader svelte-1so44k6");
    			add_location(div23, file, 62, 4, 1832);
    			attr_dev(div24, "class", "subheader svelte-1so44k6");
    			add_location(div24, file, 63, 4, 1873);
    			attr_dev(div25, "class", "subheader svelte-1so44k6");
    			add_location(div25, file, 64, 4, 1915);
    			attr_dev(div26, "class", "row svelte-1so44k6");
    			add_location(div26, file, 60, 3, 1767);
    			attr_dev(div27, "class", "value svelte-1so44k6");
    			add_location(div27, file, 68, 4, 1994);
    			attr_dev(div28, "class", "value svelte-1so44k6");
    			add_location(div28, file, 69, 4, 2051);
    			attr_dev(div29, "class", "value svelte-1so44k6");
    			add_location(div29, file, 70, 4, 2106);
    			attr_dev(div30, "class", "value svelte-1so44k6");
    			add_location(div30, file, 71, 4, 2162);
    			attr_dev(div31, "class", "row svelte-1so44k6");
    			add_location(div31, file, 67, 3, 1972);
    			attr_dev(div32, "class", "header svelte-1so44k6");
    			add_location(div32, file, 75, 2, 2261);
    			attr_dev(div33, "class", "subheader svelte-1so44k6");
    			add_location(div33, file, 77, 4, 2323);
    			attr_dev(div34, "class", "subheader svelte-1so44k6");
    			add_location(div34, file, 78, 4, 2366);
    			attr_dev(div35, "class", "subheader svelte-1so44k6");
    			add_location(div35, file, 79, 4, 2413);
    			attr_dev(div36, "class", "subheader svelte-1so44k6");
    			add_location(div36, file, 80, 4, 2454);
    			attr_dev(div37, "class", "subheader svelte-1so44k6");
    			add_location(div37, file, 81, 4, 2496);
    			attr_dev(div38, "class", "row svelte-1so44k6");
    			add_location(div38, file, 76, 3, 2301);
    			attr_dev(div39, "class", "value svelte-1so44k6");
    			add_location(div39, file, 85, 4, 2575);
    			attr_dev(div40, "class", "value svelte-1so44k6");
    			add_location(div40, file, 86, 4, 2633);
    			attr_dev(div41, "class", "value svelte-1so44k6");
    			add_location(div41, file, 87, 4, 2695);
    			attr_dev(div42, "class", "value svelte-1so44k6");
    			add_location(div42, file, 88, 4, 2751);
    			attr_dev(div43, "class", "value svelte-1so44k6");
    			add_location(div43, file, 89, 4, 2808);
    			attr_dev(div44, "class", "row svelte-1so44k6");
    			add_location(div44, file, 84, 3, 2553);
    			attr_dev(div45, "class", "header svelte-1so44k6");
    			add_location(div45, file, 92, 2, 2879);
    			attr_dev(div46, "class", "subheader svelte-1so44k6");
    			add_location(div46, file, 94, 4, 2940);
    			attr_dev(div47, "class", "subheader svelte-1so44k6");
    			add_location(div47, file, 95, 4, 2983);
    			attr_dev(div48, "class", "subheader svelte-1so44k6");
    			add_location(div48, file, 96, 4, 3030);
    			attr_dev(div49, "class", "subheader svelte-1so44k6");
    			add_location(div49, file, 97, 4, 3071);
    			attr_dev(div50, "class", "subheader svelte-1so44k6");
    			add_location(div50, file, 98, 4, 3113);
    			attr_dev(div51, "class", "row svelte-1so44k6");
    			add_location(div51, file, 93, 3, 2918);
    			attr_dev(div52, "class", "value svelte-1so44k6");
    			add_location(div52, file, 102, 4, 3192);
    			attr_dev(div53, "class", "value svelte-1so44k6");
    			add_location(div53, file, 103, 4, 3249);
    			attr_dev(div54, "class", "value svelte-1so44k6");
    			add_location(div54, file, 104, 4, 3310);
    			attr_dev(div55, "class", "value svelte-1so44k6");
    			add_location(div55, file, 105, 4, 3365);
    			attr_dev(div56, "class", "value svelte-1so44k6");
    			add_location(div56, file, 106, 4, 3421);
    			attr_dev(div57, "class", "row svelte-1so44k6");
    			add_location(div57, file, 101, 3, 3170);
    			attr_dev(div58, "class", "header svelte-1so44k6");
    			add_location(div58, file, 109, 2, 3491);
    			attr_dev(div59, "class", "subheader svelte-1so44k6");
    			add_location(div59, file, 111, 4, 3553);
    			attr_dev(div60, "class", "subheader svelte-1so44k6");
    			add_location(div60, file, 112, 4, 3598);
    			attr_dev(div61, "class", "subheader svelte-1so44k6");
    			add_location(div61, file, 113, 4, 3645);
    			attr_dev(div62, "class", "subheader svelte-1so44k6");
    			add_location(div62, file, 114, 4, 3686);
    			attr_dev(div63, "class", "subheader svelte-1so44k6");
    			add_location(div63, file, 115, 4, 3728);
    			attr_dev(div64, "class", "row svelte-1so44k6");
    			add_location(div64, file, 110, 3, 3531);
    			attr_dev(div65, "class", "value svelte-1so44k6");
    			add_location(div65, file, 119, 4, 3807);
    			attr_dev(div66, "class", "value svelte-1so44k6");
    			add_location(div66, file, 120, 4, 3867);
    			attr_dev(div67, "class", "value svelte-1so44k6");
    			add_location(div67, file, 121, 4, 3929);
    			attr_dev(div68, "class", "value svelte-1so44k6");
    			add_location(div68, file, 122, 4, 3985);
    			attr_dev(div69, "class", "value svelte-1so44k6");
    			add_location(div69, file, 123, 4, 4042);
    			attr_dev(div70, "class", "row svelte-1so44k6");
    			add_location(div70, file, 118, 3, 3785);
    			attr_dev(div71, "class", "header svelte-1so44k6");
    			add_location(div71, file, 126, 2, 4113);
    			attr_dev(div72, "class", "subheader svelte-1so44k6");
    			add_location(div72, file, 128, 4, 4174);
    			attr_dev(div73, "class", "subheader svelte-1so44k6");
    			add_location(div73, file, 129, 4, 4219);
    			attr_dev(div74, "class", "subheader svelte-1so44k6");
    			add_location(div74, file, 130, 4, 4266);
    			attr_dev(div75, "class", "subheader svelte-1so44k6");
    			add_location(div75, file, 131, 4, 4307);
    			attr_dev(div76, "class", "subheader svelte-1so44k6");
    			add_location(div76, file, 132, 4, 4349);
    			attr_dev(div77, "class", "row svelte-1so44k6");
    			add_location(div77, file, 127, 3, 4152);
    			attr_dev(div78, "class", "value svelte-1so44k6");
    			add_location(div78, file, 136, 4, 4428);
    			attr_dev(div79, "class", "value svelte-1so44k6");
    			add_location(div79, file, 137, 4, 4487);
    			attr_dev(div80, "class", "value svelte-1so44k6");
    			add_location(div80, file, 138, 4, 4548);
    			attr_dev(div81, "class", "value svelte-1so44k6");
    			add_location(div81, file, 139, 4, 4603);
    			attr_dev(div82, "class", "value svelte-1so44k6");
    			add_location(div82, file, 140, 4, 4659);
    			attr_dev(div83, "class", "row svelte-1so44k6");
    			add_location(div83, file, 135, 3, 4406);
    			attr_dev(div84, "class", "region column svelte-1so44k6");
    			add_location(div84, file, 31, 1, 789);
    			attr_dev(div85, "class", "wrapper svelte-1so44k6");
    			add_location(div85, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div85, anchor);
    			append_dev(div85, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div85, t0);
    			append_dev(div85, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div85, t1);
    			append_dev(div85, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t3);
    			append_dev(div2, button1);
    			append_dev(div2, t5);
    			append_dev(div2, button2);
    			append_dev(div2, t7);
    			append_dev(div2, button3);
    			append_dev(div2, t9);
    			append_dev(div2, textarea);
    			append_dev(div85, t10);
    			append_dev(div85, div84);
    			append_dev(div84, div3);
    			append_dev(div84, t12);
    			append_dev(div84, div7);
    			append_dev(div7, div4);
    			append_dev(div7, t14);
    			append_dev(div7, div5);
    			append_dev(div7, t16);
    			append_dev(div7, div6);
    			append_dev(div84, t18);
    			append_dev(div84, div11);
    			append_dev(div11, div8);
    			append_dev(div8, t19);
    			append_dev(div11, t20);
    			append_dev(div11, div9);
    			append_dev(div9, t21);
    			append_dev(div11, t22);
    			append_dev(div11, div10);
    			append_dev(div10, t23);
    			append_dev(div84, t24);
    			append_dev(div84, div12);
    			append_dev(div84, t26);
    			append_dev(div84, div16);
    			append_dev(div16, div13);
    			append_dev(div16, t28);
    			append_dev(div16, div14);
    			append_dev(div16, t30);
    			append_dev(div16, div15);
    			append_dev(div84, t32);
    			append_dev(div84, div20);
    			append_dev(div20, div17);
    			append_dev(div17, t33);
    			append_dev(div20, t34);
    			append_dev(div20, div18);
    			append_dev(div18, t35);
    			append_dev(div20, t36);
    			append_dev(div20, div19);
    			append_dev(div19, t37);
    			append_dev(div84, t38);
    			append_dev(div84, div21);
    			append_dev(div84, t40);
    			append_dev(div84, div26);
    			append_dev(div26, div22);
    			append_dev(div26, t42);
    			append_dev(div26, div23);
    			append_dev(div26, t44);
    			append_dev(div26, div24);
    			append_dev(div26, t46);
    			append_dev(div26, div25);
    			append_dev(div84, t48);
    			append_dev(div84, div31);
    			append_dev(div31, div27);
    			append_dev(div27, t49);
    			append_dev(div31, t50);
    			append_dev(div31, div28);
    			append_dev(div28, t51);
    			append_dev(div31, t52);
    			append_dev(div31, div29);
    			append_dev(div29, t53);
    			append_dev(div31, t54);
    			append_dev(div31, div30);
    			append_dev(div30, t55);
    			append_dev(div84, t56);
    			append_dev(div84, div32);
    			append_dev(div84, t58);
    			append_dev(div84, div38);
    			append_dev(div38, div33);
    			append_dev(div38, t60);
    			append_dev(div38, div34);
    			append_dev(div38, t62);
    			append_dev(div38, div35);
    			append_dev(div38, t64);
    			append_dev(div38, div36);
    			append_dev(div38, t66);
    			append_dev(div38, div37);
    			append_dev(div84, t68);
    			append_dev(div84, div44);
    			append_dev(div44, div39);
    			append_dev(div39, t69);
    			append_dev(div44, t70);
    			append_dev(div44, div40);
    			append_dev(div40, t71);
    			append_dev(div44, t72);
    			append_dev(div44, div41);
    			append_dev(div41, t73);
    			append_dev(div44, t74);
    			append_dev(div44, div42);
    			append_dev(div42, t75);
    			append_dev(div44, t76);
    			append_dev(div44, div43);
    			append_dev(div43, t77);
    			append_dev(div84, t78);
    			append_dev(div84, div45);
    			append_dev(div84, t80);
    			append_dev(div84, div51);
    			append_dev(div51, div46);
    			append_dev(div51, t82);
    			append_dev(div51, div47);
    			append_dev(div51, t84);
    			append_dev(div51, div48);
    			append_dev(div51, t86);
    			append_dev(div51, div49);
    			append_dev(div51, t88);
    			append_dev(div51, div50);
    			append_dev(div84, t90);
    			append_dev(div84, div57);
    			append_dev(div57, div52);
    			append_dev(div52, t91);
    			append_dev(div57, t92);
    			append_dev(div57, div53);
    			append_dev(div53, t93);
    			append_dev(div57, t94);
    			append_dev(div57, div54);
    			append_dev(div54, t95);
    			append_dev(div57, t96);
    			append_dev(div57, div55);
    			append_dev(div55, t97);
    			append_dev(div57, t98);
    			append_dev(div57, div56);
    			append_dev(div56, t99);
    			append_dev(div84, t100);
    			append_dev(div84, div58);
    			append_dev(div84, t102);
    			append_dev(div84, div64);
    			append_dev(div64, div59);
    			append_dev(div64, t104);
    			append_dev(div64, div60);
    			append_dev(div64, t106);
    			append_dev(div64, div61);
    			append_dev(div64, t108);
    			append_dev(div64, div62);
    			append_dev(div64, t110);
    			append_dev(div64, div63);
    			append_dev(div84, t112);
    			append_dev(div84, div70);
    			append_dev(div70, div65);
    			append_dev(div65, t113);
    			append_dev(div70, t114);
    			append_dev(div70, div66);
    			append_dev(div66, t115);
    			append_dev(div70, t116);
    			append_dev(div70, div67);
    			append_dev(div67, t117);
    			append_dev(div70, t118);
    			append_dev(div70, div68);
    			append_dev(div68, t119);
    			append_dev(div70, t120);
    			append_dev(div70, div69);
    			append_dev(div69, t121);
    			append_dev(div84, t122);
    			append_dev(div84, div71);
    			append_dev(div84, t124);
    			append_dev(div84, div77);
    			append_dev(div77, div72);
    			append_dev(div77, t126);
    			append_dev(div77, div73);
    			append_dev(div77, t128);
    			append_dev(div77, div74);
    			append_dev(div77, t130);
    			append_dev(div77, div75);
    			append_dev(div77, t132);
    			append_dev(div77, div76);
    			append_dev(div84, t134);
    			append_dev(div84, div83);
    			append_dev(div83, div78);
    			append_dev(div78, t135);
    			append_dev(div83, t136);
    			append_dev(div83, div79);
    			append_dev(div79, t137);
    			append_dev(div83, t138);
    			append_dev(div83, div80);
    			append_dev(div80, t139);
    			append_dev(div83, t140);
    			append_dev(div83, div81);
    			append_dev(div81, t141);
    			append_dev(div83, t142);
    			append_dev(div83, div82);
    			append_dev(div82, t143);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*reset*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*clear*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*review*/ ctx[4], false, false, false),
    					listen_dev(button3, "click", /*save*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*state, addContainer*/ 65) {
    				each_value_1 = /*state*/ ctx[0].Deck_Scan_Results || [];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*state, addContainer*/ 65) {
    				each_value = /*state*/ ctx[0].Tray_Scan_Results || [];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*logs*/ 2) {
    				prop_dev(textarea, "value", /*logs*/ ctx[1]);
    			}

    			if (dirty & /*state*/ 1 && t19_value !== (t19_value = /*state*/ ctx[0].Tray_Scan.Request + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*state*/ 1 && t21_value !== (t21_value = /*state*/ ctx[0].Tray_Scan.Complete + "")) set_data_dev(t21, t21_value);
    			if (dirty & /*state*/ 1 && t23_value !== (t23_value = /*state*/ ctx[0].Tray_Scan.Acknowledge + "")) set_data_dev(t23, t23_value);
    			if (dirty & /*state*/ 1 && t33_value !== (t33_value = /*state*/ ctx[0].Deck_Scan.Request + "")) set_data_dev(t33, t33_value);
    			if (dirty & /*state*/ 1 && t35_value !== (t35_value = /*state*/ ctx[0].Deck_Scan.Complete + "")) set_data_dev(t35, t35_value);
    			if (dirty & /*state*/ 1 && t37_value !== (t37_value = /*state*/ ctx[0].Deck_Scan.Acknowledge + "")) set_data_dev(t37, t37_value);
    			if (dirty & /*state*/ 1 && t49_value !== (t49_value = /*state*/ ctx[0].Load_Tray.Load_Slot + "")) set_data_dev(t49, t49_value);
    			if (dirty & /*state*/ 1 && t51_value !== (t51_value = /*state*/ ctx[0].Load_Tray.Request + "")) set_data_dev(t51, t51_value);
    			if (dirty & /*state*/ 1 && t53_value !== (t53_value = /*state*/ ctx[0].Load_Tray.Complete + "")) set_data_dev(t53, t53_value);
    			if (dirty & /*state*/ 1 && t55_value !== (t55_value = /*state*/ ctx[0].Load_Tray.Acknowledge + "")) set_data_dev(t55, t55_value);
    			if (dirty & /*state*/ 1 && t69_value !== (t69_value = /*state*/ ctx[0].Pick_Front.Tray_Area + "")) set_data_dev(t69, t69_value);
    			if (dirty & /*state*/ 1 && t71_value !== (t71_value = /*state*/ ctx[0].Pick_Front.Active_Nozzle + "")) set_data_dev(t71, t71_value);
    			if (dirty & /*state*/ 1 && t73_value !== (t73_value = /*state*/ ctx[0].Pick_Front.Request + "")) set_data_dev(t73, t73_value);
    			if (dirty & /*state*/ 1 && t75_value !== (t75_value = /*state*/ ctx[0].Pick_Front.Complete + "")) set_data_dev(t75, t75_value);
    			if (dirty & /*state*/ 1 && t77_value !== (t77_value = /*state*/ ctx[0].Pick_Front.Acknowledge + "")) set_data_dev(t77, t77_value);
    			if (dirty & /*state*/ 1 && t91_value !== (t91_value = /*state*/ ctx[0].Pick_Rear.Tray_Area + "")) set_data_dev(t91, t91_value);
    			if (dirty & /*state*/ 1 && t93_value !== (t93_value = /*state*/ ctx[0].Pick_Rear.Active_Nozzle + "")) set_data_dev(t93, t93_value);
    			if (dirty & /*state*/ 1 && t95_value !== (t95_value = /*state*/ ctx[0].Pick_Rear.Request + "")) set_data_dev(t95, t95_value);
    			if (dirty & /*state*/ 1 && t97_value !== (t97_value = /*state*/ ctx[0].Pick_Rear.Complete + "")) set_data_dev(t97, t97_value);
    			if (dirty & /*state*/ 1 && t99_value !== (t99_value = /*state*/ ctx[0].Pick_Rear.Acknowledge + "")) set_data_dev(t99, t99_value);
    			if (dirty & /*state*/ 1 && t113_value !== (t113_value = /*state*/ ctx[0].Drop_Front.Destination + "")) set_data_dev(t113, t113_value);
    			if (dirty & /*state*/ 1 && t115_value !== (t115_value = /*state*/ ctx[0].Drop_Front.Active_Nozzle + "")) set_data_dev(t115, t115_value);
    			if (dirty & /*state*/ 1 && t117_value !== (t117_value = /*state*/ ctx[0].Drop_Front.Request + "")) set_data_dev(t117, t117_value);
    			if (dirty & /*state*/ 1 && t119_value !== (t119_value = /*state*/ ctx[0].Drop_Front.Complete + "")) set_data_dev(t119, t119_value);
    			if (dirty & /*state*/ 1 && t121_value !== (t121_value = /*state*/ ctx[0].Drop_Front.Acknowledge + "")) set_data_dev(t121, t121_value);
    			if (dirty & /*state*/ 1 && t135_value !== (t135_value = /*state*/ ctx[0].Drop_Rear.Destination + "")) set_data_dev(t135, t135_value);
    			if (dirty & /*state*/ 1 && t137_value !== (t137_value = /*state*/ ctx[0].Drop_Rear.Active_Nozzle + "")) set_data_dev(t137, t137_value);
    			if (dirty & /*state*/ 1 && t139_value !== (t139_value = /*state*/ ctx[0].Drop_Rear.Request + "")) set_data_dev(t139, t139_value);
    			if (dirty & /*state*/ 1 && t141_value !== (t141_value = /*state*/ ctx[0].Drop_Rear.Complete + "")) set_data_dev(t141, t141_value);
    			if (dirty & /*state*/ 1 && t143_value !== (t143_value = /*state*/ ctx[0].Drop_Rear.Acknowledge + "")) set_data_dev(t143, t143_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div85);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function createContainers() {
    	return Array.from({ length: 32 }, (_, i) => '');
    }

    function createTrays() {
    	return Array.from({ length: 25 }, (_, i) => '');
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	class State {
    		constructor(containers, trays) {
    			this.Deck_Scan = {
    				Request: false,
    				Complete: false,
    				Acknowledge: false
    			};

    			this.Deck_Scan_Results = createContainers();

    			this.Tray_Scan = {
    				Request: false,
    				Complete: false,
    				Acknowledge: false
    			};

    			this.Tray_Scan_Results = createTrays();

    			this.Load_Tray = {
    				Load_Slot: -1,
    				Request: false,
    				Complete: false,
    				Acknowledge: false
    			};

    			this.Pick_Front = {
    				Tray_Area: -1,
    				Active_Nozzle: 0,
    				Request: false,
    				Complete: false,
    				Acknowledge: false
    			};

    			this.Pick_Rear = {
    				Tray_Area: -1,
    				Active_Nozzle: 0,
    				Request: false,
    				Complete: false,
    				Acknowledge: false
    			};

    			this.Drop_Front = {
    				Destination: -1,
    				Active_Nozzle: 0,
    				Request: false,
    				Complete: false,
    				Acknowledge: false
    			};

    			this.Drop_Rear = {
    				Destination: -1,
    				Active_Nozzle: 0,
    				Request: false,
    				Complete: false,
    				Acknowledge: false
    			};
    		}

    		toString() {
    			return JSON.stringify(this, null, ' ');
    		}
    	}

    	function addLogMessage(msg) {
    		$$invalidate(1, logs += `${msg}\n`);
    	}

    	function clear() {
    		$$invalidate(1, logs = "");
    	}

    	function reset() {
    		$$invalidate(0, state = new State());
    		addLogMessage('Reset state');
    		containers = createContainers();
    		addLogMessage('Reset loaded containers');
    		trays = createTrays();
    		addLogMessage('Reset loaded trays');
    	}

    	function review() {
    		// addLogMessage(state);
    		addLogMessage("Loaded containers:");

    		containers.forEach(x => {
    			if (x?.trim() != '') {
    				addLogMessage(x);
    			}
    		});

    		addLogMessage('Done listing containers...');
    		addLogMessage("Loaded trays:");

    		trays.forEach(x => {
    			if (x?.trim() != '') {
    				addLogMessage(x);
    			}
    		});

    		addLogMessage('Done listing trays...');
    	}

    	function save() {
    		uibuilder.send({
    			'topic': 'stateChanged',
    			'payload': state
    		});
    	}

    	uibuilder.onChange('msg', msg => {
    		if (!msg.payload) return;
    		$$invalidate(0, state = msg.payload);
    	});

    	function addContainer(barcode) {
    		if (barcode?.trim() == '') return;
    		save();
    		addLogMessage(`Added ${barcode}`);
    	}

    	let containers = createContainers();
    	let trays = createTrays();
    	let state = new State(containers, trays);
    	let logs = '';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler(each_value_1, container_index) {
    		each_value_1[container_index] = this.value;
    		$$invalidate(0, state);
    	}

    	const blur_handler = container => addContainer(container);

    	function input_input_handler_1(each_value, tray_index) {
    		each_value[tray_index] = this.value;
    		$$invalidate(0, state);
    	}

    	const blur_handler_1 = tray => addContainer(tray);

    	$$self.$capture_state = () => ({
    		State,
    		createContainers,
    		createTrays,
    		addLogMessage,
    		clear,
    		reset,
    		review,
    		save,
    		addContainer,
    		containers,
    		trays,
    		state,
    		logs
    	});

    	$$self.$inject_state = $$props => {
    		if ('containers' in $$props) containers = $$props.containers;
    		if ('trays' in $$props) trays = $$props.trays;
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    		if ('logs' in $$props) $$invalidate(1, logs = $$props.logs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		state,
    		logs,
    		clear,
    		reset,
    		review,
    		save,
    		addContainer,
    		input_input_handler,
    		blur_handler,
    		input_input_handler_1,
    		blur_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        // props: {
        //     anotherProp: 'I am from a prop set in main.js'
        // }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
