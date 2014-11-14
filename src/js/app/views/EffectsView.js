/**
 * hyperion remote
 * MIT License
 */

define(['lib/stapes'], function (Stapes) {
    'use strict';

    return Stapes.subclass(/** @lends EffectsView.prototype */{
        /**
         * @class EffectsView
         * @constructs
         */
        constructor: function () {
            this.bindEventHandlers();
        },

        /**
         * @private
         */
        bindEventHandlers: function () {
            window.addClickHandler(document.querySelector('#effects ul'), function (event) {
                var selected = event.target.parentNode.querySelector('.selected');
                if (selected) {
                    selected.classList.remove('selected');
                }
                event.target.classList.add('selected');
                this.emit('effectSelected', event.target.dataset.index);
            }.bind(this));
        },

        /**
         * Clear the list
         */
        clear: function () {
            document.querySelector('#effects ul').innerHTML = '';
        },

        /**
         * Fill the list
         * @param {object} effects - Object containing effect information
         */
        fillList: function (effects) {
            var dom, el, i;

            dom = document.createDocumentFragment();

            for (i = 0; i < effects.length; i++) {
                el = document.createElement('li');
                el.innerHTML = effects[i].name;
                el.dataset.index = i;
                dom.appendChild(el);
            }

            document.querySelector('#effects ul').appendChild(dom);
        }
    });
});

