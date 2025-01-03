/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("src_components_Map_GermanyGlobe_tsx",{

/***/ "./src/components/Map/GermanyMap.tsx":
/*!*******************************************!*\
  !*** ./src/components/Map/GermanyMap.tsx ***!
  \*******************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GermanyMap: () => (/* binding */ GermanyMap)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"./node_modules/react/jsx-dev-runtime.js\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! three */ \"./node_modules/three/build/three.module.js\");\n/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/utils */ \"./src/lib/utils.ts\");\n/* harmony import */ var _effects_AcademicSign__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./effects/AcademicSign */ \"./src/components/Map/effects/AcademicSign.tsx\");\n/* harmony import */ var _effects_ConnectionLines__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./effects/ConnectionLines */ \"./src/components/Map/effects/ConnectionLines.tsx\");\n/* harmony import */ var _effects_StateLabels__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./effects/StateLabels */ \"./src/components/Map/effects/StateLabels.tsx\");\n/* harmony import */ var _effects_StateLabels__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_effects_StateLabels__WEBPACK_IMPORTED_MODULE_5__);\n\nvar _s = $RefreshSig$();\n\n\n\n\n\n\nconst GermanyMap = (param)=>{\n    let { schools } = param;\n    _s();\n    const [selectedSchool, setSelectedSchool] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [hoveredSchool, setHoveredSchool] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const groupRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    // Function to handle zooming to a school's location\n    const handleSchoolFocus = (school)=>{\n        const position = (0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.latLongToVector3)(school.lat, school.long, 1.02);\n        const targetPosition = new three__WEBPACK_IMPORTED_MODULE_6__.Vector3(position.x * 1.1, position.y * 1.1, position.z * 1.1);\n    // Add camera animation logic here\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"group\", {\n        ref: groupRef,\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_effects_StateLabels__WEBPACK_IMPORTED_MODULE_5__.StateLabels, {}, void 0, false, {\n                fileName: \"/home/parsa/map-of-german-students/src/components/Map/GermanyMap.tsx\",\n                lineNumber: 32,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_effects_ConnectionLines__WEBPACK_IMPORTED_MODULE_4__.ConnectionLines, {\n                schools: schools,\n                selectedSchool: selectedSchool\n            }, void 0, false, {\n                fileName: \"/home/parsa/map-of-german-students/src/components/Map/GermanyMap.tsx\",\n                lineNumber: 33,\n                columnNumber: 7\n            }, undefined),\n            schools.map((school)=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_effects_AcademicSign__WEBPACK_IMPORTED_MODULE_3__.AcademicSign, {\n                    position: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.latLongToVector3)(school.lat, school.long),\n                    school: school,\n                    onLearnMore: ()=>handleSchoolFocus(school)\n                }, school.name, false, {\n                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/GermanyMap.tsx\",\n                    lineNumber: 35,\n                    columnNumber: 9\n                }, undefined))\n        ]\n    }, void 0, true, {\n        fileName: \"/home/parsa/map-of-german-students/src/components/Map/GermanyMap.tsx\",\n        lineNumber: 31,\n        columnNumber: 5\n    }, undefined);\n};\n_s(GermanyMap, \"WPQNYWv0lXnagZyJn2vPKSTEBGM=\");\n_c = GermanyMap;\nvar _c;\n$RefreshReg$(_c, \"GermanyMap\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9NYXAvR2VybWFueU1hcC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFnRDtBQUVqQjtBQUVnQjtBQUNPO0FBQ007QUFDUjtBQU03QyxNQUFNUSxhQUF3QztRQUFDLEVBQUVDLE9BQU8sRUFBRTs7SUFDL0QsTUFBTSxDQUFDQyxnQkFBZ0JDLGtCQUFrQixHQUFHVCwrQ0FBUUEsQ0FBZ0I7SUFDcEUsTUFBTSxDQUFDVSxlQUFlQyxpQkFBaUIsR0FBR1gsK0NBQVFBLENBQWdCO0lBQ2xFLE1BQU1ZLFdBQVdiLDZDQUFNQSxDQUFjO0lBRXJDLG9EQUFvRDtJQUNwRCxNQUFNYyxvQkFBb0IsQ0FBQ0M7UUFDekIsTUFBTUMsV0FBV2IsNERBQWdCQSxDQUFDWSxPQUFPRSxHQUFHLEVBQUVGLE9BQU9HLElBQUksRUFBRTtRQUMzRCxNQUFNQyxpQkFBaUIsSUFBSWpCLDBDQUFhLENBQ3RDYyxTQUFTSyxDQUFDLEdBQUcsS0FDYkwsU0FBU00sQ0FBQyxHQUFHLEtBQ2JOLFNBQVNPLENBQUMsR0FBRztJQUVmLGtDQUFrQztJQUNwQztJQUVBLHFCQUNFLDhEQUFDQztRQUFNQyxLQUFLWjs7MEJBQ1YsOERBQUNQLDZEQUFXQTs7Ozs7MEJBQ1osOERBQUNELHFFQUFlQTtnQkFBQ0csU0FBU0E7Z0JBQVNDLGdCQUFnQkE7Ozs7OztZQUNsREQsUUFBUWtCLEdBQUcsQ0FBQyxDQUFDWCx1QkFDWiw4REFBQ1gsK0RBQVlBO29CQUVYWSxVQUFVYiw0REFBZ0JBLENBQUNZLE9BQU9FLEdBQUcsRUFBRUYsT0FBT0csSUFBSTtvQkFDbERILFFBQVFBO29CQUNSWSxhQUFhLElBQU1iLGtCQUFrQkM7bUJBSGhDQSxPQUFPYSxJQUFJOzs7Ozs7Ozs7OztBQVExQixFQUFFO0dBOUJXckI7S0FBQUEiLCJzb3VyY2VzIjpbIi9ob21lL3BhcnNhL21hcC1vZi1nZXJtYW4tc3R1ZGVudHMvc3JjL2NvbXBvbmVudHMvTWFwL0dlcm1hbnlNYXAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlRnJhbWUgfSBmcm9tICdAcmVhY3QtdGhyZWUvZmliZXInO1xuaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgU2Nob29sIH0gZnJvbSAnQC90eXBlcy9zY2hvb2wnO1xuaW1wb3J0IHsgbGF0TG9uZ1RvVmVjdG9yMyB9IGZyb20gJ0AvbGliL3V0aWxzJztcbmltcG9ydCB7IEFjYWRlbWljU2lnbiB9IGZyb20gJy4vZWZmZWN0cy9BY2FkZW1pY1NpZ24nO1xuaW1wb3J0IHsgQ29ubmVjdGlvbkxpbmVzIH0gZnJvbSAnLi9lZmZlY3RzL0Nvbm5lY3Rpb25MaW5lcyc7XG5pbXBvcnQgeyBTdGF0ZUxhYmVscyB9IGZyb20gJy4vZWZmZWN0cy9TdGF0ZUxhYmVscyc7XG5cbmludGVyZmFjZSBHZXJtYW55TWFwUHJvcHMge1xuICBzY2hvb2xzOiBTY2hvb2xbXTtcbn1cblxuZXhwb3J0IGNvbnN0IEdlcm1hbnlNYXA6IFJlYWN0LkZDPEdlcm1hbnlNYXBQcm9wcz4gPSAoeyBzY2hvb2xzIH0pID0+IHtcbiAgY29uc3QgW3NlbGVjdGVkU2Nob29sLCBzZXRTZWxlY3RlZFNjaG9vbF0gPSB1c2VTdGF0ZTxTY2hvb2wgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2hvdmVyZWRTY2hvb2wsIHNldEhvdmVyZWRTY2hvb2xdID0gdXNlU3RhdGU8U2Nob29sIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IGdyb3VwUmVmID0gdXNlUmVmPFRIUkVFLkdyb3VwPihudWxsKTtcblxuICAvLyBGdW5jdGlvbiB0byBoYW5kbGUgem9vbWluZyB0byBhIHNjaG9vbCdzIGxvY2F0aW9uXG4gIGNvbnN0IGhhbmRsZVNjaG9vbEZvY3VzID0gKHNjaG9vbDogU2Nob29sKSA9PiB7XG4gICAgY29uc3QgcG9zaXRpb24gPSBsYXRMb25nVG9WZWN0b3IzKHNjaG9vbC5sYXQsIHNjaG9vbC5sb25nLCAxLjAyKTtcbiAgICBjb25zdCB0YXJnZXRQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgcG9zaXRpb24ueCAqIDEuMSxcbiAgICAgIHBvc2l0aW9uLnkgKiAxLjEsXG4gICAgICBwb3NpdGlvbi56ICogMS4xXG4gICAgKTtcbiAgICAvLyBBZGQgY2FtZXJhIGFuaW1hdGlvbiBsb2dpYyBoZXJlXG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8Z3JvdXAgcmVmPXtncm91cFJlZn0+XG4gICAgICA8U3RhdGVMYWJlbHMgLz5cbiAgICAgIDxDb25uZWN0aW9uTGluZXMgc2Nob29scz17c2Nob29sc30gc2VsZWN0ZWRTY2hvb2w9e3NlbGVjdGVkU2Nob29sfSAvPlxuICAgICAge3NjaG9vbHMubWFwKChzY2hvb2wpID0+IChcbiAgICAgICAgPEFjYWRlbWljU2lnblxuICAgICAgICAgIGtleT17c2Nob29sLm5hbWV9XG4gICAgICAgICAgcG9zaXRpb249e2xhdExvbmdUb1ZlY3RvcjMoc2Nob29sLmxhdCwgc2Nob29sLmxvbmcpfVxuICAgICAgICAgIHNjaG9vbD17c2Nob29sfVxuICAgICAgICAgIG9uTGVhcm5Nb3JlPXsoKSA9PiBoYW5kbGVTY2hvb2xGb2N1cyhzY2hvb2wpfVxuICAgICAgICAvPlxuICAgICAgKSl9XG4gICAgPC9ncm91cD5cbiAgKTtcbn07ICJdLCJuYW1lcyI6WyJSZWFjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwiVEhSRUUiLCJsYXRMb25nVG9WZWN0b3IzIiwiQWNhZGVtaWNTaWduIiwiQ29ubmVjdGlvbkxpbmVzIiwiU3RhdGVMYWJlbHMiLCJHZXJtYW55TWFwIiwic2Nob29scyIsInNlbGVjdGVkU2Nob29sIiwic2V0U2VsZWN0ZWRTY2hvb2wiLCJob3ZlcmVkU2Nob29sIiwic2V0SG92ZXJlZFNjaG9vbCIsImdyb3VwUmVmIiwiaGFuZGxlU2Nob29sRm9jdXMiLCJzY2hvb2wiLCJwb3NpdGlvbiIsImxhdCIsImxvbmciLCJ0YXJnZXRQb3NpdGlvbiIsIlZlY3RvcjMiLCJ4IiwieSIsInoiLCJncm91cCIsInJlZiIsIm1hcCIsIm9uTGVhcm5Nb3JlIiwibmFtZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/components/Map/GermanyMap.tsx\n"));

/***/ }),

/***/ "./src/components/Map/effects/StateLabels.tsx":
/*!****************************************************!*\
  !*** ./src/components/Map/effects/StateLabels.tsx ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



;
    // Wrapped in an IIFE to avoid polluting the global scope
    ;
    (function () {
        var _a, _b;
        // Legacy CSS implementations will `eval` browser code in a Node.js context
        // to extract CSS. For backwards compatibility, we need to check we're in a
        // browser context before continuing.
        if (typeof self !== 'undefined' &&
            // AMP / No-JS mode does not inject these helpers:
            '$RefreshHelpers$' in self) {
            // @ts-ignore __webpack_module__ is global
            var currentExports = module.exports;
            // @ts-ignore __webpack_module__ is global
            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;
            // This cannot happen in MainTemplate because the exports mismatch between
            // templating and execution.
            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);
            // A module can be accepted automatically based on its exports, e.g. when
            // it is a Refresh Boundary.
            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {
                // Save the previous exports signature on update so we can compare the boundary
                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)
                module.hot.dispose(function (data) {
                    data.prevSignature =
                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);
                });
                // Unconditionally accept an update to this module, we'll check if it's
                // still a Refresh Boundary later.
                // @ts-ignore importMeta is replaced in the loader
                module.hot.accept();
                // This field is set when the previous version of this module was a
                // Refresh Boundary, letting us know we need to check for invalidation or
                // enqueue an update.
                if (prevSignature !== null) {
                    // A boundary can become ineligible if its exports are incompatible
                    // with the previous exports.
                    //
                    // For example, if you add/remove/change exports, we'll want to
                    // re-execute the importing modules, and force those components to
                    // re-render. Similarly, if you convert a class component to a
                    // function, we want to invalidate the boundary.
                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {
                        module.hot.invalidate();
                    }
                    else {
                        self.$RefreshHelpers$.scheduleUpdate();
                    }
                }
            }
            else {
                // Since we just executed the code for the module, it's possible that the
                // new exports made it ineligible for being a boundary.
                // We only care about the case when we were _previously_ a boundary,
                // because we already accepted this update (accidental side effect).
                var isNoLongerABoundary = prevSignature !== null;
                if (isNoLongerABoundary) {
                    module.hot.invalidate();
                }
            }
        }
    })();


/***/ })

});