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

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AcademicSign: () => (/* binding */ AcademicSign)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"./node_modules/react/jsx-dev-runtime.js\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"./node_modules/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _react_three_drei__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @react-three/drei */ \"./node_modules/@react-three/drei/index.js\");\n/* harmony import */ var _react_three_fiber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @react-three/fiber */ \"./node_modules/@react-three/fiber/dist/react-three-fiber.esm.js\");\n\nvar _s = $RefreshSig$();\n\n\n\nconst AcademicSign = (param)=>{\n    let { position, school, onLearnMore } = param;\n    _s();\n    const [hovered, setHovered] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const signRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    const initialY = position.y;\n    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);\n    (0,_react_three_fiber__WEBPACK_IMPORTED_MODULE_2__.useFrame)({\n        \"AcademicSign.useFrame\": (state)=>{\n            if (signRef.current) {\n                signRef.current.position.y = initialY + Math.sin(state.clock.elapsedTime) * 0.001;\n            }\n        }\n    }[\"AcademicSign.useFrame\"]);\n    const getSignSymbol = (type)=>{\n        switch(type){\n            case 'university':\n                return '🎓';\n            case 'kunsthochschule':\n                return '🎨';\n            case 'hochschule':\n                return '📚';\n            default:\n                return '🏛️';\n        }\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"group\", {\n        ref: signRef,\n        position: position,\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_react_three_drei__WEBPACK_IMPORTED_MODULE_3__.Billboard, {\n                follow: true,\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"group\", {\n                    children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"mesh\", {\n                        onPointerEnter: ()=>setHovered(true),\n                        onPointerLeave: ()=>setHovered(false),\n                        children: [\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"circleGeometry\", {\n                                args: [\n                                    0.02,\n                                    32\n                                ]\n                            }, void 0, false, {\n                                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                lineNumber: 49,\n                                columnNumber: 13\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meshBasicMaterial\", {\n                                transparent: true,\n                                opacity: 0\n                            }, void 0, false, {\n                                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                lineNumber: 50,\n                                columnNumber: 13\n                            }, undefined),\n                            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_react_three_drei__WEBPACK_IMPORTED_MODULE_3__.Text, {\n                                position: [\n                                    0,\n                                    0,\n                                    0.001\n                                ],\n                                fontSize: 0.015,\n                                color: hovered ? '#ffffff' : '#cccccc',\n                                anchorX: \"center\",\n                                anchorY: \"middle\",\n                                outlineWidth: 0.0002,\n                                outlineColor: \"#000000\",\n                                children: getSignSymbol(school.type)\n                            }, void 0, false, {\n                                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                lineNumber: 51,\n                                columnNumber: 13\n                            }, undefined)\n                        ]\n                    }, void 0, true, {\n                        fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                        lineNumber: 45,\n                        columnNumber: 11\n                    }, undefined)\n                }, void 0, false, {\n                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                    lineNumber: 44,\n                    columnNumber: 9\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                lineNumber: 43,\n                columnNumber: 7\n            }, undefined),\n            hovered && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_react_three_drei__WEBPACK_IMPORTED_MODULE_3__.Html, {\n                position: [\n                    0,\n                    0.02,\n                    0\n                ],\n                center: true,\n                distanceFactor: 150,\n                style: {\n                    transition: 'all 0.2s ease-out',\n                    opacity: 1,\n                    transform: 'scale(0.15)',\n                    transformOrigin: 'center center',\n                    pointerEvents: 'none'\n                },\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    style: {\n                        width: '120px',\n                        background: 'rgba(0,0,0,0.8)',\n                        borderRadius: '4px',\n                        padding: '4px',\n                        color: 'white',\n                        fontSize: '8px',\n                        backdropFilter: 'blur(4px)',\n                        border: '1px solid rgba(255,255,255,0.1)',\n                        whiteSpace: 'nowrap',\n                        overflow: 'hidden',\n                        textOverflow: 'ellipsis'\n                    },\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h3\", {\n                            style: {\n                                margin: '0 0 2px 0',\n                                fontSize: '9px',\n                                fontWeight: 'bold',\n                                whiteSpace: 'nowrap',\n                                overflow: 'hidden',\n                                textOverflow: 'ellipsis'\n                            },\n                            children: school.name\n                        }, void 0, false, {\n                            fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                            lineNumber: 92,\n                            columnNumber: 13\n                        }, undefined),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            style: {\n                                display: 'flex',\n                                gap: '2px',\n                                marginBottom: '2px'\n                            },\n                            children: [\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                                    style: {\n                                        background: 'rgba(255,255,255,0.1)',\n                                        padding: '1px 3px',\n                                        borderRadius: '2px',\n                                        fontSize: '7px'\n                                    },\n                                    children: school.type\n                                }, void 0, false, {\n                                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                    lineNumber: 94,\n                                    columnNumber: 15\n                                }, undefined),\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                                    style: {\n                                        border: '1px solid rgba(255,255,255,0.2)',\n                                        padding: '1px 3px',\n                                        borderRadius: '2px',\n                                        fontSize: '7px'\n                                    },\n                                    children: school.state\n                                }, void 0, false, {\n                                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                    lineNumber: 102,\n                                    columnNumber: 15\n                                }, undefined)\n                            ]\n                        }, void 0, true, {\n                            fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                            lineNumber: 93,\n                            columnNumber: 13\n                        }, undefined),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            style: {\n                                display: 'flex',\n                                justifyContent: 'space-between',\n                                marginTop: '4px',\n                                fontSize: '7px',\n                                gap: '4px'\n                            },\n                            children: [\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                    onClick: (e)=>{\n                                        e.stopPropagation();\n                                        window.open(school.website, '_blank');\n                                    },\n                                    style: {\n                                        background: 'none',\n                                        border: 'none',\n                                        color: '#3b82f6',\n                                        cursor: 'pointer',\n                                        padding: '1px 3px',\n                                        fontSize: '7px',\n                                        pointerEvents: 'auto'\n                                    },\n                                    children: \"Visit →\"\n                                }, void 0, false, {\n                                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                    lineNumber: 118,\n                                    columnNumber: 15\n                                }, undefined),\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                    onClick: (e)=>{\n                                        e.stopPropagation();\n                                        onLearnMore();\n                                    },\n                                    style: {\n                                        background: '#3b82f6',\n                                        border: 'none',\n                                        color: 'white',\n                                        padding: '1px 3px',\n                                        borderRadius: '2px',\n                                        cursor: 'pointer',\n                                        fontSize: '7px',\n                                        pointerEvents: 'auto'\n                                    },\n                                    children: \"Learn More\"\n                                }, void 0, false, {\n                                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                                    lineNumber: 135,\n                                    columnNumber: 15\n                                }, undefined)\n                            ]\n                        }, void 0, true, {\n                            fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                            lineNumber: 111,\n                            columnNumber: 13\n                        }, undefined)\n                    ]\n                }, void 0, true, {\n                    fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                    lineNumber: 79,\n                    columnNumber: 11\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n                lineNumber: 67,\n                columnNumber: 9\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"/home/parsa/map-of-german-students/src/components/Map/effects/AcademicSign.tsx\",\n        lineNumber: 42,\n        columnNumber: 5\n    }, undefined);\n};\n_s(AcademicSign, \"PgGzny8MfyoOMzy2EkZ/ujt0u9c=\", false, function() {\n    return [\n        _react_three_fiber__WEBPACK_IMPORTED_MODULE_2__.useFrame\n    ];\n});\n_c = AcademicSign;\nvar _c;\n$RefreshReg$(_c, \"AcademicSign\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tcG9uZW50cy9NYXAvZWZmZWN0cy9BY2FkZW1pY1NpZ24udHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFnRDtBQUVVO0FBQ1o7QUFZdkMsTUFBTU8sZUFBNEM7UUFBQyxFQUFFQyxRQUFRLEVBQUVDLE1BQU0sRUFBRUMsV0FBVyxFQUFFOztJQUN6RixNQUFNLENBQUNDLFNBQVNDLFdBQVcsR0FBR1gsK0NBQVFBLENBQUM7SUFDdkMsTUFBTVksVUFBVVgsNkNBQU1BLENBQWM7SUFDcEMsTUFBTVksV0FBV04sU0FBU08sQ0FBQztJQUMzQixNQUFNQyxXQUFXLDRCQUE0QkMsSUFBSSxDQUFDQyxVQUFVQyxTQUFTO0lBRXJFYiw0REFBUUE7aUNBQUMsQ0FBQ2M7WUFDUixJQUFJUCxRQUFRUSxPQUFPLEVBQUU7Z0JBQ25CUixRQUFRUSxPQUFPLENBQUNiLFFBQVEsQ0FBQ08sQ0FBQyxHQUFHRCxXQUFXUSxLQUFLQyxHQUFHLENBQUNILE1BQU1JLEtBQUssQ0FBQ0MsV0FBVyxJQUFJO1lBQzlFO1FBQ0Y7O0lBRUEsTUFBTUMsZ0JBQWdCLENBQUNDO1FBQ3JCLE9BQVFBO1lBQ04sS0FBSztnQkFDSCxPQUFPO1lBQ1QsS0FBSztnQkFDSCxPQUFPO1lBQ1QsS0FBSztnQkFDSCxPQUFPO1lBQ1Q7Z0JBQ0UsT0FBTztRQUNYO0lBQ0Y7SUFFQSxxQkFDRSw4REFBQ0M7UUFBTUMsS0FBS2hCO1FBQVNMLFVBQVVBOzswQkFDN0IsOERBQUNILHdEQUFTQTtnQkFBQ3lCLFFBQVE7MEJBQ2pCLDRFQUFDRjs4QkFDQyw0RUFBQ0c7d0JBQ0NDLGdCQUFnQixJQUFNcEIsV0FBVzt3QkFDakNxQixnQkFBZ0IsSUFBTXJCLFdBQVc7OzBDQUVqQyw4REFBQ3NCO2dDQUFlQyxNQUFNO29DQUFDO29DQUFNO2lDQUFHOzs7Ozs7MENBQ2hDLDhEQUFDQztnQ0FBa0JDLFdBQVc7Z0NBQUNDLFNBQVM7Ozs7OzswQ0FDeEMsOERBQUNsQyxtREFBSUE7Z0NBQ0hJLFVBQVU7b0NBQUM7b0NBQUc7b0NBQUc7aUNBQU07Z0NBQ3ZCK0IsVUFBVTtnQ0FDVkMsT0FBTzdCLFVBQVUsWUFBWTtnQ0FDN0I4QixTQUFRO2dDQUNSQyxTQUFRO2dDQUNSQyxjQUFjO2dDQUNkQyxjQUFhOzBDQUVabEIsY0FBY2pCLE9BQU9rQixJQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBTWpDaEIseUJBQ0MsOERBQUNSLG1EQUFJQTtnQkFDSEssVUFBVTtvQkFBQztvQkFBRztvQkFBTTtpQkFBRTtnQkFDdEJxQyxNQUFNO2dCQUNOQyxnQkFBZ0I7Z0JBQ2hCQyxPQUFPO29CQUNMQyxZQUFZO29CQUNaVixTQUFTO29CQUNUVyxXQUFXO29CQUNYQyxpQkFBaUI7b0JBQ2pCQyxlQUFlO2dCQUNqQjswQkFFQSw0RUFBQ0M7b0JBQUlMLE9BQU87d0JBQ1ZNLE9BQU87d0JBQ1BDLFlBQVk7d0JBQ1pDLGNBQWM7d0JBQ2RDLFNBQVM7d0JBQ1RoQixPQUFPO3dCQUNQRCxVQUFVO3dCQUNWa0IsZ0JBQWdCO3dCQUNoQkMsUUFBUTt3QkFDUkMsWUFBWTt3QkFDWkMsVUFBVTt3QkFDVkMsY0FBYztvQkFDaEI7O3NDQUNFLDhEQUFDQzs0QkFBR2YsT0FBTztnQ0FBRWdCLFFBQVE7Z0NBQWF4QixVQUFVO2dDQUFPeUIsWUFBWTtnQ0FBUUwsWUFBWTtnQ0FBVUMsVUFBVTtnQ0FBVUMsY0FBYzs0QkFBVztzQ0FBSXBELE9BQU93RCxJQUFJOzs7Ozs7c0NBQ3pKLDhEQUFDYjs0QkFBSUwsT0FBTztnQ0FBRW1CLFNBQVM7Z0NBQVFDLEtBQUs7Z0NBQU9DLGNBQWM7NEJBQU07OzhDQUM3RCw4REFBQ0M7b0NBQUt0QixPQUFPO3dDQUNYTyxZQUFZO3dDQUNaRSxTQUFTO3dDQUNURCxjQUFjO3dDQUNkaEIsVUFBVTtvQ0FDWjs4Q0FDRzlCLE9BQU9rQixJQUFJOzs7Ozs7OENBRWQsOERBQUMwQztvQ0FBS3RCLE9BQU87d0NBQ1hXLFFBQVE7d0NBQ1JGLFNBQVM7d0NBQ1RELGNBQWM7d0NBQ2RoQixVQUFVO29DQUNaOzhDQUNHOUIsT0FBT1csS0FBSzs7Ozs7Ozs7Ozs7O3NDQUdqQiw4REFBQ2dDOzRCQUFJTCxPQUFPO2dDQUNWbUIsU0FBUztnQ0FDVEksZ0JBQWdCO2dDQUNoQkMsV0FBVztnQ0FDWGhDLFVBQVU7Z0NBQ1Y0QixLQUFLOzRCQUNQOzs4Q0FDRSw4REFBQ0s7b0NBQ0NDLFNBQVMsQ0FBQ0M7d0NBQ1JBLEVBQUVDLGVBQWU7d0NBQ2pCQyxPQUFPQyxJQUFJLENBQUNwRSxPQUFPcUUsT0FBTyxFQUFFO29DQUM5QjtvQ0FDQS9CLE9BQU87d0NBQ0xPLFlBQVk7d0NBQ1pJLFFBQVE7d0NBQ1JsQixPQUFPO3dDQUNQdUMsUUFBUTt3Q0FDUnZCLFNBQVM7d0NBQ1RqQixVQUFVO3dDQUNWWSxlQUFlO29DQUNqQjs4Q0FDRDs7Ozs7OzhDQUdELDhEQUFDcUI7b0NBQ0NDLFNBQVMsQ0FBQ0M7d0NBQ1JBLEVBQUVDLGVBQWU7d0NBQ2pCakU7b0NBQ0Y7b0NBQ0FxQyxPQUFPO3dDQUNMTyxZQUFZO3dDQUNaSSxRQUFRO3dDQUNSbEIsT0FBTzt3Q0FDUGdCLFNBQVM7d0NBQ1RELGNBQWM7d0NBQ2R3QixRQUFRO3dDQUNSeEMsVUFBVTt3Q0FDVlksZUFBZTtvQ0FDakI7OENBQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBU2YsRUFBRTtHQS9JVzVDOztRQU1YRCx3REFBUUE7OztLQU5HQyIsInNvdXJjZXMiOlsiL2hvbWUvcGFyc2EvbWFwLW9mLWdlcm1hbi1zdHVkZW50cy9zcmMvY29tcG9uZW50cy9NYXAvZWZmZWN0cy9BY2FkZW1pY1NpZ24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlUmVmIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IEh0bWwsIFRleHQsIEJpbGxib2FyZCB9IGZyb20gJ0ByZWFjdC10aHJlZS9kcmVpJztcbmltcG9ydCB7IHVzZUZyYW1lIH0gZnJvbSAnQHJlYWN0LXRocmVlL2ZpYmVyJztcbmltcG9ydCB7IFNjaG9vbCB9IGZyb20gJ0AvdHlwZXMvc2Nob29sJztcbmltcG9ydCB7IENhcmQsIENhcmRDb250ZW50LCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUgfSBmcm9tIFwiQC9jb21wb25lbnRzL3VpL2NhcmRcIjtcbmltcG9ydCB7IEJhZGdlIH0gZnJvbSBcIkAvY29tcG9uZW50cy91aS9iYWRnZVwiO1xuaW1wb3J0IEltYWdlIGZyb20gJ25leHQvaW1hZ2UnO1xuXG5pbnRlcmZhY2UgQWNhZGVtaWNTaWduUHJvcHMge1xuICBwb3NpdGlvbjogVmVjdG9yMztcbiAgc2Nob29sOiBTY2hvb2w7XG4gIG9uTGVhcm5Nb3JlOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY29uc3QgQWNhZGVtaWNTaWduOiBSZWFjdC5GQzxBY2FkZW1pY1NpZ25Qcm9wcz4gPSAoeyBwb3NpdGlvbiwgc2Nob29sLCBvbkxlYXJuTW9yZSB9KSA9PiB7XG4gIGNvbnN0IFtob3ZlcmVkLCBzZXRIb3ZlcmVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3Qgc2lnblJlZiA9IHVzZVJlZjxUSFJFRS5Hcm91cD4obnVsbCk7XG4gIGNvbnN0IGluaXRpYWxZID0gcG9zaXRpb24ueTtcbiAgY29uc3QgaXNNb2JpbGUgPSAvaVBob25lfGlQYWR8aVBvZHxBbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuICB1c2VGcmFtZSgoc3RhdGUpID0+IHtcbiAgICBpZiAoc2lnblJlZi5jdXJyZW50KSB7XG4gICAgICBzaWduUmVmLmN1cnJlbnQucG9zaXRpb24ueSA9IGluaXRpYWxZICsgTWF0aC5zaW4oc3RhdGUuY2xvY2suZWxhcHNlZFRpbWUpICogMC4wMDE7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBnZXRTaWduU3ltYm9sID0gKHR5cGU6IFNjaG9vbFsndHlwZSddKSA9PiB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICd1bml2ZXJzaXR5JzpcbiAgICAgICAgcmV0dXJuICfwn46TJztcbiAgICAgIGNhc2UgJ2t1bnN0aG9jaHNjaHVsZSc6XG4gICAgICAgIHJldHVybiAn8J+OqCc7XG4gICAgICBjYXNlICdob2Noc2NodWxlJzpcbiAgICAgICAgcmV0dXJuICfwn5OaJztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAn8J+Pm++4jyc7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGdyb3VwIHJlZj17c2lnblJlZn0gcG9zaXRpb249e3Bvc2l0aW9ufT5cbiAgICAgIDxCaWxsYm9hcmQgZm9sbG93PXt0cnVlfT5cbiAgICAgICAgPGdyb3VwPlxuICAgICAgICAgIDxtZXNoXG4gICAgICAgICAgICBvblBvaW50ZXJFbnRlcj17KCkgPT4gc2V0SG92ZXJlZCh0cnVlKX1cbiAgICAgICAgICAgIG9uUG9pbnRlckxlYXZlPXsoKSA9PiBzZXRIb3ZlcmVkKGZhbHNlKX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8Y2lyY2xlR2VvbWV0cnkgYXJncz17WzAuMDIsIDMyXX0gLz5cbiAgICAgICAgICAgIDxtZXNoQmFzaWNNYXRlcmlhbCB0cmFuc3BhcmVudCBvcGFjaXR5PXswfSAvPlxuICAgICAgICAgICAgPFRleHRcbiAgICAgICAgICAgICAgcG9zaXRpb249e1swLCAwLCAwLjAwMV19XG4gICAgICAgICAgICAgIGZvbnRTaXplPXswLjAxNX1cbiAgICAgICAgICAgICAgY29sb3I9e2hvdmVyZWQgPyAnI2ZmZmZmZicgOiAnI2NjY2NjYyd9XG4gICAgICAgICAgICAgIGFuY2hvclg9XCJjZW50ZXJcIlxuICAgICAgICAgICAgICBhbmNob3JZPVwibWlkZGxlXCJcbiAgICAgICAgICAgICAgb3V0bGluZVdpZHRoPXswLjAwMDJ9XG4gICAgICAgICAgICAgIG91dGxpbmVDb2xvcj1cIiMwMDAwMDBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7Z2V0U2lnblN5bWJvbChzY2hvb2wudHlwZSl9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9tZXNoPlxuICAgICAgICA8L2dyb3VwPlxuICAgICAgPC9CaWxsYm9hcmQ+XG5cbiAgICAgIHtob3ZlcmVkICYmIChcbiAgICAgICAgPEh0bWxcbiAgICAgICAgICBwb3NpdGlvbj17WzAsIDAuMDIsIDBdfVxuICAgICAgICAgIGNlbnRlclxuICAgICAgICAgIGRpc3RhbmNlRmFjdG9yPXsxNTB9XG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIHRyYW5zaXRpb246ICdhbGwgMC4ycyBlYXNlLW91dCcsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnc2NhbGUoMC4xNSknLFxuICAgICAgICAgICAgdHJhbnNmb3JtT3JpZ2luOiAnY2VudGVyIGNlbnRlcicsXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZSdcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBcbiAgICAgICAgICAgIHdpZHRoOiAnMTIwcHgnLFxuICAgICAgICAgICAgYmFja2dyb3VuZDogJ3JnYmEoMCwwLDAsMC44KScsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6ICc0cHgnLFxuICAgICAgICAgICAgcGFkZGluZzogJzRweCcsXG4gICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcbiAgICAgICAgICAgIGZvbnRTaXplOiAnOHB4JyxcbiAgICAgICAgICAgIGJhY2tkcm9wRmlsdGVyOiAnYmx1cig0cHgpJyxcbiAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LDAuMSknLFxuICAgICAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCcsXG4gICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICAgICAgICB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcydcbiAgICAgICAgICB9fT5cbiAgICAgICAgICAgIDxoMyBzdHlsZT17eyBtYXJnaW46ICcwIDAgMnB4IDAnLCBmb250U2l6ZTogJzlweCcsIGZvbnRXZWlnaHQ6ICdib2xkJywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIG92ZXJmbG93OiAnaGlkZGVuJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnIH19PntzY2hvb2wubmFtZX08L2gzPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGdhcDogJzJweCcsIG1hcmdpbkJvdHRvbTogJzJweCcgfX0+XG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwyNTUsMjU1LDAuMSknLCBcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMXB4IDNweCcsIFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzJweCcsIFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnN3B4JyBcbiAgICAgICAgICAgICAgfX0+XG4gICAgICAgICAgICAgICAge3NjaG9vbC50eXBlfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IFxuICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LDAuMiknLCBcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMXB4IDNweCcsIFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzJweCcsIFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnN3B4JyBcbiAgICAgICAgICAgICAgfX0+XG4gICAgICAgICAgICAgICAge3NjaG9vbC5zdGF0ZX1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IFxuICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsIFxuICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLCBcbiAgICAgICAgICAgICAgbWFyZ2luVG9wOiAnNHB4JyxcbiAgICAgICAgICAgICAgZm9udFNpemU6ICc3cHgnLFxuICAgICAgICAgICAgICBnYXA6ICc0cHgnXG4gICAgICAgICAgICB9fT5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgd2luZG93Lm9wZW4oc2Nob29sLndlYnNpdGUsICdfYmxhbmsnKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzNiODJmNicsXG4gICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxcHggM3B4JyxcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnN3B4JyxcbiAgICAgICAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdhdXRvJ1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICBWaXNpdCDihpJcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgIG9uTGVhcm5Nb3JlKCk7XG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyMzYjgyZjYnLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXG4gICAgICAgICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxcHggM3B4JyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzJweCcsXG4gICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnN3B4JyxcbiAgICAgICAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdhdXRvJ1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICBMZWFybiBNb3JlXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvSHRtbD5cbiAgICAgICl9XG4gICAgPC9ncm91cD5cbiAgKTtcbn07ICJdLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwidXNlUmVmIiwiSHRtbCIsIlRleHQiLCJCaWxsYm9hcmQiLCJ1c2VGcmFtZSIsIkFjYWRlbWljU2lnbiIsInBvc2l0aW9uIiwic2Nob29sIiwib25MZWFybk1vcmUiLCJob3ZlcmVkIiwic2V0SG92ZXJlZCIsInNpZ25SZWYiLCJpbml0aWFsWSIsInkiLCJpc01vYmlsZSIsInRlc3QiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJzdGF0ZSIsImN1cnJlbnQiLCJNYXRoIiwic2luIiwiY2xvY2siLCJlbGFwc2VkVGltZSIsImdldFNpZ25TeW1ib2wiLCJ0eXBlIiwiZ3JvdXAiLCJyZWYiLCJmb2xsb3ciLCJtZXNoIiwib25Qb2ludGVyRW50ZXIiLCJvblBvaW50ZXJMZWF2ZSIsImNpcmNsZUdlb21ldHJ5IiwiYXJncyIsIm1lc2hCYXNpY01hdGVyaWFsIiwidHJhbnNwYXJlbnQiLCJvcGFjaXR5IiwiZm9udFNpemUiLCJjb2xvciIsImFuY2hvclgiLCJhbmNob3JZIiwib3V0bGluZVdpZHRoIiwib3V0bGluZUNvbG9yIiwiY2VudGVyIiwiZGlzdGFuY2VGYWN0b3IiLCJzdHlsZSIsInRyYW5zaXRpb24iLCJ0cmFuc2Zvcm0iLCJ0cmFuc2Zvcm1PcmlnaW4iLCJwb2ludGVyRXZlbnRzIiwiZGl2Iiwid2lkdGgiLCJiYWNrZ3JvdW5kIiwiYm9yZGVyUmFkaXVzIiwicGFkZGluZyIsImJhY2tkcm9wRmlsdGVyIiwiYm9yZGVyIiwid2hpdGVTcGFjZSIsIm92ZXJmbG93IiwidGV4dE92ZXJmbG93IiwiaDMiLCJtYXJnaW4iLCJmb250V2VpZ2h0IiwibmFtZSIsImRpc3BsYXkiLCJnYXAiLCJtYXJnaW5Cb3R0b20iLCJzcGFuIiwianVzdGlmeUNvbnRlbnQiLCJtYXJnaW5Ub3AiLCJidXR0b24iLCJvbkNsaWNrIiwiZSIsInN0b3BQcm9wYWdhdGlvbiIsIndpbmRvdyIsIm9wZW4iLCJ3ZWJzaXRlIiwiY3Vyc29yIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/components/Map/effects/AcademicSign.tsx\n"));

/***/ })

});