// knockout-classBindingProvider v0.4.1 | (c) 2013 Ryan Niemeyer | http://www.opensource.org/licenses/mit-license
!(function (factory) {
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require("knockout"), exports);
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["knockout", "exports"], factory);
    } else {
        // <script> tag: use the global `ko` object, attaching a `bindings` property
        factory(ko);
    }
}(function (ko, exports) {
    var plugin = "bindings",
        space = /\s/.test("\u00A0") ? "\\s+" : "[\\s\\u00A0]+",
        glueRegex = new RegExp(space, "g"),
        trimRegex = new RegExp("^" + space + "|" + space + "$", "g"),
        trim = function (string) {
            return (!!string) ? string.replace(trimRegex, "") : "";
        };

    function ClassBindings(underlyingProvider, options) {
        this.bindings = {};
        this.setOptions(options);
        this.underlyingProvider = underlyingProvider;
    }

    ClassBindings.prototype = {
        /**
         * Apply configuration options for current instance.
         * @param {Object} options
         */
        setOptions: function (options) {
            this.options = options || (options = {});
            this.fallback = !!options.fallback;
            this.attribute = options.attribute || "data-class";
            this.virtualAttribute = "ko " + (options.virtualAttribute || "class") + ":";
        },

        /**
         * Returns true if given node has bindings.
         * @param {HTMLElement|Comment|Node} node
         * @param {Object} bindingContext
         * @return {Boolean}
         */
        nodeHasBindings: function ClassBindings$nodeHasBindings(node, bindingContext) {
            var nodeType = node.nodeType;
            return (1 === nodeType && node.getAttribute(this.attribute))
                || (8 === nodeType && -1 !== ("" + node.nodeValue || node.text).indexOf(this.virtualAttribute))
                || (this.fallback && this.underlyingProvider.nodeHasBindings(node, bindingContext));
        },

        /**
         * Returns bindings for given node.
         * @param {HTMLElement|Comment|Node} node
         * @param {Object} bindingContext
         * @return {Object}
         */
        getBindings: function ClassBindings$getBindings(node, bindingContext) {
            var classList = this.getClassList(node),
                bindings = {},
                source = this.bindings;

            if (!!classList) {
                for (var i = 0, length = classList.length; i < length; i++) {
                    var bindingAccessor = this.queryBindings(classList[i], source);
                    if (!!bindingAccessor) {
                        ko.utils.extend(bindings, "function" === typeof(bindingAccessor)
                            ? bindingAccessor.call(bindingContext.$data, bindingContext, node, classList)
                            : bindingAccessor);
                    }
                }
            }
            else if (this.fallback) {
                bindings = this.underlyingProvider.getBindings(node, bindingContext);
            }
            return bindings;
        },

        /**
         * Adds bindings into current collection.
         * @param {Object} bindings
         */
        addBindings: function ClassBindings$addBindings(bindings) {
            this.mergeBindings(this.bindings, bindings);
        },

        /**
         * Clears current bindings.
         */
        clearBindings: function(){
            this.bindings = {};
        },

        /**
         * Returns bindings for query (object used as bindings source).
         * @param query
         * @param object
         * @return {*}
         */
        queryBindings: function ClassBindings$queryBindings(query, object) {
            if (!!object) {
                if (!!object[query]) {
                    return object[query];
                }
                var offset = query.indexOf(".");
                if (-1 !== offset) {
                    return ClassBindings$queryBindings(query.substring(-~offset), object[query.substring(0, offset)]);
                }
            }
        },

        /**
         * Merges bindings without overwriting.
         * @param {Object} existingBindings
         * @param {Object} bindings
         */
        mergeBindings: function ClassBindings$mergeBindings(existingBindings, bindings) {
            for (var key in bindings) {
                if (bindings.hasOwnProperty(key)){
                    (existingBindings.hasOwnProperty(key) && "object" === typeof (bindings[key]))
                        ? ClassBindings$mergeBindings(existingBindings[key], bindings[key])
                        : (existingBindings[key] = bindings[key]);
                }
            }
        },

        /**
         * Returns class list of bindings for given node.
         * @param {HTMLElement|Node|Comment} node
         * @return {Array|Boolean}
         */
        getClassList: function ClassBindings$getClassList(node) {
            var nodeType = node.nodeType,
                source;

            if (1 === nodeType) {
                source = node.getAttribute(this.attribute);
            }
            else if (8 === nodeType) {
                var value = "" + node.nodeValue || node.text,
                    index = value.indexOf(this.virtualAttribute);

                if (-1 !== index) {
                    source = value.substring(index + this.virtualAttribute.length);
                }
            }

            return source && trim(source).split(glueRegex);
        }
    };

    return exports[plugin] = ko[plugin] = ClassBindings;
}));
