"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("src_components_Map_GermanyGlobe_tsx",{

/***/ "./src/components/Map/effects/AcademicSign.tsx":
/*!*****************************************************!*\
  !*** ./src/components/Map/effects/AcademicSign.tsx ***!
  \*****************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AcademicSign: () => (/* binding */ AcademicSign)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"./node_modules/react/jsx-dev-runtime.js\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _react_three_drei__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @react-three/drei */ \"./node_modules/@react-three/drei/index.js\");\n/* harmony import */ var _react_three_fiber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @react-three/fiber */ \"./node_modules/@react-three/fiber/dist/react-three-fiber.esm.js\");\n/* harmony import */ var _UniversityTooltip__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./UniversityTooltip */ \"./src/components/Map/effects/UniversityTooltip.tsx\");\n\nvar _s = $RefreshSig$();\n\n\n\n\nconst AcademicSign = (param)=>{\n    let { position, school, onLearnMore } = param;\n    _s();\n    const [hovered, setHovered] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const signRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    const initialY = position.y;\n    const { camera } = (0,_react_three_fiber__WEBPACK_IMPORTED_MODULE_3__.useThree)();\n    (0,_react_three_fiber__WEBPACK_IMPORTED_MODULE_3__.useFrame)({\n        \"AcademicSign.useFrame\": (state)=>{\n            if (signRef.current) {\n                signRef.current.position.y = initialY + Math.sin(state.clock.elapsedTime) * 0.001;\n            }\n        }\n    }[\"AcademicSign.useFrame\"]);\n    const getSignSymbol = (type)=>{\n        switch(type){\n            case 'university':\n                return '🎓';\n            case 'kunsthochschule':\n                return '🎨';\n            case 'hochschule':\n                return '📚';\n            default:\n                return '🏛️';\n        }\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"group\", {\n        ref: signRef,\n        position: position,\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_react_three_drei__WEBPACK_IMPORTED_MODULE_4__.Billboard, {\n                follow: true,\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"group\", {\n                    children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"mesh\", {\n                        onPointerEnter: ()=>setHovered(true),\n                        onPointerLeave: ()=>setHovered(false),\n                        onClick: ()=>onLearnMore(),\n                        children: [\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"circleGeometry\", {\n                                args: [\n                                    0.02,\n                                    32\n                                ]\n                            }, void 0, false, {\n                                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                lineNumber: 48,\n                                columnNumber: 13\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meshBasicMaterial\", {\n                                transparent: true,\n                                opacity: 0\n                            }, void 0, false, {\n                                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                lineNumber: 49,\n                                columnNumber: 13\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_react_three_drei__WEBPACK_IMPORTED_MODULE_4__.Text, {\n                                position: [\n                                    0,\n                                    0,\n                                    0.001\n                                ],\n                                fontSize: 0.015,\n                                color: hovered ? '#ffffff' : '#cccccc',\n                                anchorX: \"center\",\n                                anchorY: \"middle\",\n                                outlineWidth: 0.0002,\n                                outlineColor: \"#000000\",\n                                children: getSignSymbol(school.type)\n                            }, void 0, false, {\n                                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                lineNumber: 50,\n                                columnNumber: 13\n                            }, undefined)\n                        ]\n                    }, void 0, true, {\n                        fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                        lineNumber: 43,\n                        columnNumber: 11\n                    }, undefined)\n                }, void 0, false, {\n                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                    lineNumber: 42,\n                    columnNumber: 9\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                lineNumber: 41,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_UniversityTooltip__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n                isHovered: hovered,\n                position: [\n                    0,\n                    0.03,\n                    0\n                ],\n                school: school,\n                cameraDistance: camera.position.length()\n            }, void 0, false, {\n                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                lineNumber: 65,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n        lineNumber: 40,\n        columnNumber: 5\n    }, undefined);\n};\n_s(AcademicSign, \"P2rtdEUoFpDzFj47Lh7qNMecMx4=\", false, function() {\n    return [\n        _react_three_fiber__WEBPACK_IMPORTED_MODULE_3__.useThree,\n        _react_three_fiber__WEBPACK_IMPORTED_MODULE_3__.useFrame\n    ];\n});\n_c = AcademicSign;\nvar _c;\n$RefreshReg$(_c, \"AcademicSign\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9NYXAvZWZmZWN0cy9BY2FkZW1pY1NpZ24udHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBZ0Q7QUFFSTtBQUNJO0FBRUo7QUFRN0MsTUFBTVEsZUFBNEM7UUFBQyxFQUFFQyxRQUFRLEVBQUVDLE1BQU0sRUFBRUMsV0FBVyxFQUFFOztJQUN6RixNQUFNLENBQUNDLFNBQVNDLFdBQVcsR0FBR1osK0NBQVFBLENBQUM7SUFDdkMsTUFBTWEsVUFBVVosNkNBQU1BLENBQWM7SUFDcEMsTUFBTWEsV0FBV04sU0FBU08sQ0FBQztJQUMzQixNQUFNLEVBQUVDLE1BQU0sRUFBRSxHQUFHWCw0REFBUUE7SUFFM0JELDREQUFRQTtpQ0FBQyxDQUFDYTtZQUNSLElBQUlKLFFBQVFLLE9BQU8sRUFBRTtnQkFDbkJMLFFBQVFLLE9BQU8sQ0FBQ1YsUUFBUSxDQUFDTyxDQUFDLEdBQUdELFdBQVdLLEtBQUtDLEdBQUcsQ0FBQ0gsTUFBTUksS0FBSyxDQUFDQyxXQUFXLElBQUk7WUFDOUU7UUFDRjs7SUFFQSxNQUFNQyxnQkFBZ0IsQ0FBQ0M7UUFDckIsT0FBUUE7WUFDTixLQUFLO2dCQUNILE9BQU87WUFDVCxLQUFLO2dCQUNILE9BQU87WUFDVCxLQUFLO2dCQUNILE9BQU87WUFDVDtnQkFDRSxPQUFPO1FBQ1g7SUFDRjtJQUVBLHFCQUNFLDhEQUFDQztRQUFNQyxLQUFLYjtRQUFTTCxVQUFVQTs7MEJBQzdCLDhEQUFDTCx3REFBU0E7Z0JBQUN3QixRQUFROzBCQUNqQiw0RUFBQ0Y7OEJBQ0MsNEVBQUNHO3dCQUNDQyxnQkFBZ0IsSUFBTWpCLFdBQVc7d0JBQ2pDa0IsZ0JBQWdCLElBQU1sQixXQUFXO3dCQUNqQ21CLFNBQVMsSUFBTXJCOzswQ0FFZiw4REFBQ3NCO2dDQUFlQyxNQUFNO29DQUFDO29DQUFNO2lDQUFHOzs7Ozs7MENBQ2hDLDhEQUFDQztnQ0FBa0JDLFdBQVc7Z0NBQUNDLFNBQVM7Ozs7OzswQ0FDeEMsOERBQUNsQyxtREFBSUE7Z0NBQ0hNLFVBQVU7b0NBQUM7b0NBQUc7b0NBQUc7aUNBQU07Z0NBQ3ZCNkIsVUFBVTtnQ0FDVkMsT0FBTzNCLFVBQVUsWUFBWTtnQ0FDN0I0QixTQUFRO2dDQUNSQyxTQUFRO2dDQUNSQyxjQUFjO2dDQUNkQyxjQUFhOzBDQUVabkIsY0FBY2QsT0FBT2UsSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzswQkFNbEMsOERBQUNsQiwwREFBaUJBO2dCQUNoQnFDLFdBQVdoQztnQkFDWEgsVUFBVTtvQkFBQztvQkFBRztvQkFBTTtpQkFBRTtnQkFDdEJDLFFBQVFBO2dCQUNSbUMsZ0JBQWdCNUIsT0FBT1IsUUFBUSxDQUFDcUMsTUFBTTs7Ozs7Ozs7Ozs7O0FBSTlDLEVBQUU7R0EzRFd0Qzs7UUFJUUYsd0RBQVFBO1FBRTNCRCx3REFBUUE7OztLQU5HRyIsInNvdXJjZXMiOlsiL2hvbWUvcGFyc2EvbWFwLW9mLWdlcm1hbi1zdHVkZW50cy9zcmMvY29tcG9uZW50cy9NYXAvZWZmZWN0cy9BY2FkZW1pY1NpZ24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlUmVmIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFRleHQsIEJpbGxib2FyZCB9IGZyb20gJ0ByZWFjdC10aHJlZS9kcmVpJztcbmltcG9ydCB7IHVzZUZyYW1lLCB1c2VUaHJlZSB9IGZyb20gJ0ByZWFjdC10aHJlZS9maWJlcic7XG5pbXBvcnQgeyBTY2hvb2wgfSBmcm9tICdAL3R5cGVzL3NjaG9vbCc7XG5pbXBvcnQgVW5pdmVyc2l0eVRvb2x0aXAgZnJvbSAnLi9Vbml2ZXJzaXR5VG9vbHRpcCc7XG5cbmludGVyZmFjZSBBY2FkZW1pY1NpZ25Qcm9wcyB7XG4gIHBvc2l0aW9uOiBWZWN0b3IzO1xuICBzY2hvb2w6IFNjaG9vbDtcbiAgb25MZWFybk1vcmU6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBjb25zdCBBY2FkZW1pY1NpZ246IFJlYWN0LkZDPEFjYWRlbWljU2lnblByb3BzPiA9ICh7IHBvc2l0aW9uLCBzY2hvb2wsIG9uTGVhcm5Nb3JlIH0pID0+IHtcbiAgY29uc3QgW2hvdmVyZWQsIHNldEhvdmVyZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBzaWduUmVmID0gdXNlUmVmPFRIUkVFLkdyb3VwPihudWxsKTtcbiAgY29uc3QgaW5pdGlhbFkgPSBwb3NpdGlvbi55O1xuICBjb25zdCB7IGNhbWVyYSB9ID0gdXNlVGhyZWUoKTtcblxuICB1c2VGcmFtZSgoc3RhdGUpID0+IHtcbiAgICBpZiAoc2lnblJlZi5jdXJyZW50KSB7XG4gICAgICBzaWduUmVmLmN1cnJlbnQucG9zaXRpb24ueSA9IGluaXRpYWxZICsgTWF0aC5zaW4oc3RhdGUuY2xvY2suZWxhcHNlZFRpbWUpICogMC4wMDE7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBnZXRTaWduU3ltYm9sID0gKHR5cGU6IFNjaG9vbFsndHlwZSddKSA9PiB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICd1bml2ZXJzaXR5JzpcbiAgICAgICAgcmV0dXJuICfwn46TJztcbiAgICAgIGNhc2UgJ2t1bnN0aG9jaHNjaHVsZSc6XG4gICAgICAgIHJldHVybiAn8J+OqCc7XG4gICAgICBjYXNlICdob2Noc2NodWxlJzpcbiAgICAgICAgcmV0dXJuICfwn5OaJztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAn8J+Pm++4jyc7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGdyb3VwIHJlZj17c2lnblJlZn0gcG9zaXRpb249e3Bvc2l0aW9ufT5cbiAgICAgIDxCaWxsYm9hcmQgZm9sbG93PXt0cnVlfT5cbiAgICAgICAgPGdyb3VwPlxuICAgICAgICAgIDxtZXNoXG4gICAgICAgICAgICBvblBvaW50ZXJFbnRlcj17KCkgPT4gc2V0SG92ZXJlZCh0cnVlKX1cbiAgICAgICAgICAgIG9uUG9pbnRlckxlYXZlPXsoKSA9PiBzZXRIb3ZlcmVkKGZhbHNlKX1cbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uTGVhcm5Nb3JlKCl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGNpcmNsZUdlb21ldHJ5IGFyZ3M9e1swLjAyLCAzMl19IC8+XG4gICAgICAgICAgICA8bWVzaEJhc2ljTWF0ZXJpYWwgdHJhbnNwYXJlbnQgb3BhY2l0eT17MH0gLz5cbiAgICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICAgIHBvc2l0aW9uPXtbMCwgMCwgMC4wMDFdfVxuICAgICAgICAgICAgICBmb250U2l6ZT17MC4wMTV9XG4gICAgICAgICAgICAgIGNvbG9yPXtob3ZlcmVkID8gJyNmZmZmZmYnIDogJyNjY2NjY2MnfVxuICAgICAgICAgICAgICBhbmNob3JYPVwiY2VudGVyXCJcbiAgICAgICAgICAgICAgYW5jaG9yWT1cIm1pZGRsZVwiXG4gICAgICAgICAgICAgIG91dGxpbmVXaWR0aD17MC4wMDAyfVxuICAgICAgICAgICAgICBvdXRsaW5lQ29sb3I9XCIjMDAwMDAwXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge2dldFNpZ25TeW1ib2woc2Nob29sLnR5cGUpfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvbWVzaD5cbiAgICAgICAgPC9ncm91cD5cbiAgICAgIDwvQmlsbGJvYXJkPlxuXG4gICAgICA8VW5pdmVyc2l0eVRvb2x0aXBcbiAgICAgICAgaXNIb3ZlcmVkPXtob3ZlcmVkfVxuICAgICAgICBwb3NpdGlvbj17WzAsIDAuMDMsIDBdfVxuICAgICAgICBzY2hvb2w9e3NjaG9vbH1cbiAgICAgICAgY2FtZXJhRGlzdGFuY2U9e2NhbWVyYS5wb3NpdGlvbi5sZW5ndGgoKX1cbiAgICAgIC8+XG4gICAgPC9ncm91cD5cbiAgKTtcbn07ICJdLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwidXNlUmVmIiwiVGV4dCIsIkJpbGxib2FyZCIsInVzZUZyYW1lIiwidXNlVGhyZWUiLCJVbml2ZXJzaXR5VG9vbHRpcCIsIkFjYWRlbWljU2lnbiIsInBvc2l0aW9uIiwic2Nob29sIiwib25MZWFybk1vcmUiLCJob3ZlcmVkIiwic2V0SG92ZXJlZCIsInNpZ25SZWYiLCJpbml0aWFsWSIsInkiLCJjYW1lcmEiLCJzdGF0ZSIsImN1cnJlbnQiLCJNYXRoIiwic2luIiwiY2xvY2siLCJlbGFwc2VkVGltZSIsImdldFNpZ25TeW1ib2wiLCJ0eXBlIiwiZ3JvdXAiLCJyZWYiLCJmb2xsb3ciLCJtZXNoIiwib25Qb2ludGVyRW50ZXIiLCJvblBvaW50ZXJMZWF2ZSIsIm9uQ2xpY2siLCJjaXJjbGVHZW9tZXRyeSIsImFyZ3MiLCJtZXNoQmFzaWNNYXRlcmlhbCIsInRyYW5zcGFyZW50Iiwib3BhY2l0eSIsImZvbnRTaXplIiwiY29sb3IiLCJhbmNob3JYIiwiYW5jaG9yWSIsIm91dGxpbmVXaWR0aCIsIm91dGxpbmVDb2xvciIsImlzSG92ZXJlZCIsImNhbWVyYURpc3RhbmNlIiwibGVuZ3RoIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/components/Map/effects/AcademicSign.tsx\n"));

/***/ }),

/***/ "./src/components/Map/effects/UniversityTooltip.tsx":
/*!**********************************************************!*\
  !*** ./src/components/Map/effects/UniversityTooltip.tsx ***!
  \**********************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"./node_modules/react/jsx-dev-runtime.js\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _react_three_drei__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @react-three/drei */ \"./node_modules/@react-three/drei/index.js\");\n\nvar _s = $RefreshSig$();\n\n\nconst UniversityTooltip = (param)=>{\n    let { isHovered, position, school, cameraDistance } = param;\n    _s();\n    const [opacity, setOpacity] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(0);\n    const tooltipRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)();\n    // Smooth transition for opacity\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"UniversityTooltip.useEffect\": ()=>{\n            setOpacity(isHovered ? 1 : 0);\n        }\n    }[\"UniversityTooltip.useEffect\"], [\n        isHovered\n    ]);\n    // Calculate scale based on camera distance\n    const getTooltipScale = ()=>{\n        // Base scale that looks good at default zoom\n        const baseScale = 0.0015;\n        // Adjust scale based on camera distance\n        return Math.min(baseScale * (cameraDistance / 10), 0.003);\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_react_three_drei__WEBPACK_IMPORTED_MODULE_2__.Html, {\n        ref: tooltipRef,\n        position: position,\n        scale: getTooltipScale(),\n        transform: true,\n        occlude: true,\n        style: {\n            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',\n            opacity: opacity,\n            pointerEvents: isHovered ? 'auto' : 'none'\n        },\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"relative backdrop-blur-sm bg-black/30 border border-white/20 rounded-lg p-4 min-w-[200px] max-w-[300px] text-white shadow-xl\",\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400\"\n                }, void 0, false, {\n                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                    lineNumber: 50,\n                    columnNumber: 9\n                }, undefined),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400\"\n                }, void 0, false, {\n                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                    lineNumber: 51,\n                    columnNumber: 9\n                }, undefined),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"space-y-2\",\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h3\", {\n                            className: \"font-bold text-lg\",\n                            children: school.name\n                        }, void 0, false, {\n                            fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                            lineNumber: 55,\n                            columnNumber: 11\n                        }, undefined),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            className: \"text-sm opacity-80\",\n                            children: school.type\n                        }, void 0, false, {\n                            fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                            lineNumber: 58,\n                            columnNumber: 11\n                        }, undefined),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            className: \"h-px bg-gradient-to-r from-transparent via-white/50 to-transparent my-2\"\n                        }, void 0, false, {\n                            fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                            lineNumber: 61,\n                            columnNumber: 11\n                        }, undefined),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            className: \"text-xs space-y-1\",\n                            children: [\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                    children: [\n                                        \"\\uD83D\\uDCCD \",\n                                        school.state\n                                    ]\n                                }, void 0, true, {\n                                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                                    lineNumber: 63,\n                                    columnNumber: 13\n                                }, undefined),\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                    children: [\n                                        \"\\uD83C\\uDF93 \",\n                                        school.programs.length,\n                                        \" Programs\"\n                                    ]\n                                }, void 0, true, {\n                                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                                    lineNumber: 64,\n                                    columnNumber: 13\n                                }, undefined),\n                                school.founded && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                    children: [\n                                        \"\\uD83D\\uDCC5 Founded: \",\n                                        school.founded\n                                    ]\n                                }, void 0, true, {\n                                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                                    lineNumber: 65,\n                                    columnNumber: 32\n                                }, undefined)\n                            ]\n                        }, void 0, true, {\n                            fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                            lineNumber: 62,\n                            columnNumber: 11\n                        }, undefined)\n                    ]\n                }, void 0, true, {\n                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                    lineNumber: 54,\n                    columnNumber: 9\n                }, undefined),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 animate-shine\"\n                }, void 0, false, {\n                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n                    lineNumber: 70,\n                    columnNumber: 9\n                }, undefined)\n            ]\n        }, void 0, true, {\n            fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n            lineNumber: 48,\n            columnNumber: 7\n        }, undefined)\n    }, void 0, false, {\n        fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/UniversityTooltip.tsx\",\n        lineNumber: 36,\n        columnNumber: 5\n    }, undefined);\n};\n_s(UniversityTooltip, \"dZxXJqsjw9DXA7rdnkKdwrJbLys=\");\n_c = UniversityTooltip;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (UniversityTooltip);\nvar _c;\n$RefreshReg$(_c, \"UniversityTooltip\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9NYXAvZWZmZWN0cy9Vbml2ZXJzaXR5VG9vbHRpcC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBMkQ7QUFFbEI7QUFVekMsTUFBTUssb0JBQXNEO1FBQUMsRUFDM0RDLFNBQVMsRUFDVEMsUUFBUSxFQUNSQyxNQUFNLEVBQ05DLGNBQWMsRUFDZjs7SUFDQyxNQUFNLENBQUNDLFNBQVNDLFdBQVcsR0FBR1YsK0NBQVFBLENBQUM7SUFDdkMsTUFBTVcsYUFBYVYsNkNBQU1BO0lBRXpCLGdDQUFnQztJQUNoQ0MsZ0RBQVNBO3VDQUFDO1lBQ1JRLFdBQVdMLFlBQVksSUFBSTtRQUM3QjtzQ0FBRztRQUFDQTtLQUFVO0lBRWQsMkNBQTJDO0lBQzNDLE1BQU1PLGtCQUFrQjtRQUN0Qiw2Q0FBNkM7UUFDN0MsTUFBTUMsWUFBWTtRQUNsQix3Q0FBd0M7UUFDeEMsT0FBT0MsS0FBS0MsR0FBRyxDQUFDRixZQUFhTCxDQUFBQSxpQkFBaUIsRUFBQyxHQUFJO0lBQ3JEO0lBRUEscUJBQ0UsOERBQUNMLG1EQUFJQTtRQUNIYSxLQUFLTDtRQUNMTCxVQUFVQTtRQUNWVyxPQUFPTDtRQUNQTSxTQUFTO1FBQ1RDLE9BQU87UUFDUEMsT0FBTztZQUNMQyxZQUFZO1lBQ1paLFNBQVNBO1lBQ1RhLGVBQWVqQixZQUFZLFNBQVM7UUFDdEM7a0JBRUEsNEVBQUNrQjtZQUFJQyxXQUFVOzs4QkFFYiw4REFBQ0Q7b0JBQUlDLFdBQVU7Ozs7Ozs4QkFDZiw4REFBQ0Q7b0JBQUlDLFdBQVU7Ozs7Ozs4QkFHZiw4REFBQ0Q7b0JBQUlDLFdBQVU7O3NDQUNiLDhEQUFDQzs0QkFBR0QsV0FBVTtzQ0FDWGpCLE9BQU9tQixJQUFJOzs7Ozs7c0NBRWQsOERBQUNIOzRCQUFJQyxXQUFVO3NDQUNaakIsT0FBT29CLElBQUk7Ozs7OztzQ0FFZCw4REFBQ0o7NEJBQUlDLFdBQVU7Ozs7OztzQ0FDZiw4REFBQ0Q7NEJBQUlDLFdBQVU7OzhDQUNiLDhEQUFDRDs7d0NBQUk7d0NBQUloQixPQUFPcUIsS0FBSzs7Ozs7Ozs4Q0FDckIsOERBQUNMOzt3Q0FBSTt3Q0FBSWhCLE9BQU9zQixRQUFRLENBQUNDLE1BQU07d0NBQUM7Ozs7Ozs7Z0NBQy9CdkIsT0FBT3dCLE9BQU8sa0JBQUksOERBQUNSOzt3Q0FBSTt3Q0FBYWhCLE9BQU93QixPQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OzhCQUt2RCw4REFBQ1I7b0JBQUlDLFdBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSXZCO0dBN0RNcEI7S0FBQUE7QUErRE4saUVBQWVBLGlCQUFpQkEsRUFBQyIsInNvdXJjZXMiOlsiL2hvbWUvcGFyc2EvbWFwLW9mLWdlcm1hbi1zdHVkZW50cy9zcmMvY29tcG9uZW50cy9NYXAvZWZmZWN0cy9Vbml2ZXJzaXR5VG9vbHRpcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VSZWYsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZUZyYW1lIH0gZnJvbSAnQHJlYWN0LXRocmVlL2ZpYmVyJztcbmltcG9ydCB7IEh0bWwgfSBmcm9tICdAcmVhY3QtdGhyZWUvZHJlaSc7XG5pbXBvcnQgeyBTY2hvb2wgfSBmcm9tICdAL3R5cGVzL3NjaG9vbCc7XG5cbmludGVyZmFjZSBVbml2ZXJzaXR5VG9vbHRpcFByb3BzIHtcbiAgaXNIb3ZlcmVkOiBib29sZWFuO1xuICBwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuICBzY2hvb2w6IFNjaG9vbDtcbiAgY2FtZXJhRGlzdGFuY2U6IG51bWJlcjtcbn1cblxuY29uc3QgVW5pdmVyc2l0eVRvb2x0aXA6IFJlYWN0LkZDPFVuaXZlcnNpdHlUb29sdGlwUHJvcHM+ID0gKHsgXG4gIGlzSG92ZXJlZCwgXG4gIHBvc2l0aW9uLCBcbiAgc2Nob29sLFxuICBjYW1lcmFEaXN0YW5jZSBcbn0pID0+IHtcbiAgY29uc3QgW29wYWNpdHksIHNldE9wYWNpdHldID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IHRvb2x0aXBSZWYgPSB1c2VSZWYoKTtcbiAgXG4gIC8vIFNtb290aCB0cmFuc2l0aW9uIGZvciBvcGFjaXR5XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgc2V0T3BhY2l0eShpc0hvdmVyZWQgPyAxIDogMCk7XG4gIH0sIFtpc0hvdmVyZWRdKTtcblxuICAvLyBDYWxjdWxhdGUgc2NhbGUgYmFzZWQgb24gY2FtZXJhIGRpc3RhbmNlXG4gIGNvbnN0IGdldFRvb2x0aXBTY2FsZSA9ICgpID0+IHtcbiAgICAvLyBCYXNlIHNjYWxlIHRoYXQgbG9va3MgZ29vZCBhdCBkZWZhdWx0IHpvb21cbiAgICBjb25zdCBiYXNlU2NhbGUgPSAwLjAwMTU7XG4gICAgLy8gQWRqdXN0IHNjYWxlIGJhc2VkIG9uIGNhbWVyYSBkaXN0YW5jZVxuICAgIHJldHVybiBNYXRoLm1pbihiYXNlU2NhbGUgKiAoY2FtZXJhRGlzdGFuY2UgLyAxMCksIDAuMDAzKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxIdG1sXG4gICAgICByZWY9e3Rvb2x0aXBSZWZ9XG4gICAgICBwb3NpdGlvbj17cG9zaXRpb259XG4gICAgICBzY2FsZT17Z2V0VG9vbHRpcFNjYWxlKCl9XG4gICAgICB0cmFuc2Zvcm1cbiAgICAgIG9jY2x1ZGVcbiAgICAgIHN0eWxlPXt7XG4gICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4zcyBjdWJpYy1iZXppZXIoMC40LCAwLCAwLjIsIDEpJyxcbiAgICAgICAgb3BhY2l0eTogb3BhY2l0eSxcbiAgICAgICAgcG9pbnRlckV2ZW50czogaXNIb3ZlcmVkID8gJ2F1dG8nIDogJ25vbmUnXG4gICAgICB9fVxuICAgID5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmUgYmFja2Ryb3AtYmx1ci1zbSBiZy1ibGFjay8zMCBib3JkZXIgYm9yZGVyLXdoaXRlLzIwIHJvdW5kZWQtbGcgcC00IG1pbi13LVsyMDBweF0gbWF4LXctWzMwMHB4XSB0ZXh0LXdoaXRlIHNoYWRvdy14bFwiPlxuICAgICAgICB7LyogSGlnaC10ZWNoIGRlY29yYXRpdmUgZWxlbWVudCAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSAtdG9wLTIgLWxlZnQtMiB3LTQgaC00IGJvcmRlci10LTIgYm9yZGVyLWwtMiBib3JkZXItYmx1ZS00MDBcIiAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIC1ib3R0b20tMiAtcmlnaHQtMiB3LTQgaC00IGJvcmRlci1iLTIgYm9yZGVyLXItMiBib3JkZXItYmx1ZS00MDBcIiAvPlxuICAgICAgICBcbiAgICAgICAgey8qIENvbnRlbnQgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LWxnXCI+XG4gICAgICAgICAgICB7c2Nob29sLm5hbWV9XG4gICAgICAgICAgPC9oMz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gb3BhY2l0eS04MFwiPlxuICAgICAgICAgICAge3NjaG9vbC50eXBlfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1weCBiZy1ncmFkaWVudC10by1yIGZyb20tdHJhbnNwYXJlbnQgdmlhLXdoaXRlLzUwIHRvLXRyYW5zcGFyZW50IG15LTJcIiAvPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyBzcGFjZS15LTFcIj5cbiAgICAgICAgICAgIDxkaXY+8J+TjSB7c2Nob29sLnN0YXRlfTwvZGl2PlxuICAgICAgICAgICAgPGRpdj7wn46TIHtzY2hvb2wucHJvZ3JhbXMubGVuZ3RofSBQcm9ncmFtczwvZGl2PlxuICAgICAgICAgICAge3NjaG9vbC5mb3VuZGVkICYmIDxkaXY+8J+ThSBGb3VuZGVkOiB7c2Nob29sLmZvdW5kZWR9PC9kaXY+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogQW5pbWF0ZWQgaGlnaGxpZ2h0IGVmZmVjdCAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC0wIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1ibHVlLTUwMC8wIHZpYS1ibHVlLTUwMC8xMCB0by1ibHVlLTUwMC8wIGFuaW1hdGUtc2hpbmVcIiAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9IdG1sPlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgVW5pdmVyc2l0eVRvb2x0aXA7ICJdLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwidXNlUmVmIiwidXNlRWZmZWN0IiwiSHRtbCIsIlVuaXZlcnNpdHlUb29sdGlwIiwiaXNIb3ZlcmVkIiwicG9zaXRpb24iLCJzY2hvb2wiLCJjYW1lcmFEaXN0YW5jZSIsIm9wYWNpdHkiLCJzZXRPcGFjaXR5IiwidG9vbHRpcFJlZiIsImdldFRvb2x0aXBTY2FsZSIsImJhc2VTY2FsZSIsIk1hdGgiLCJtaW4iLCJyZWYiLCJzY2FsZSIsInRyYW5zZm9ybSIsIm9jY2x1ZGUiLCJzdHlsZSIsInRyYW5zaXRpb24iLCJwb2ludGVyRXZlbnRzIiwiZGl2IiwiY2xhc3NOYW1lIiwiaDMiLCJuYW1lIiwidHlwZSIsInN0YXRlIiwicHJvZ3JhbXMiLCJsZW5ndGgiLCJmb3VuZGVkIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/components/Map/effects/UniversityTooltip.tsx\n"));

/***/ })

});