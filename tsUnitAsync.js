"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAsync = void 0;
var tsUnit_1 = require("./tsUnit");
var tsUnit_2 = require("./tsUnit");
Object.defineProperty(exports, "Test", { enumerable: true, get: function () { return tsUnit_2.Test; } });
Object.defineProperty(exports, "TestContext", { enumerable: true, get: function () { return tsUnit_2.TestContext; } });
Object.defineProperty(exports, "TestClass", { enumerable: true, get: function () { return tsUnit_2.TestClass; } });
Object.defineProperty(exports, "FakeFactory", { enumerable: true, get: function () { return tsUnit_2.FakeFactory; } });
Object.defineProperty(exports, "TestDescription", { enumerable: true, get: function () { return tsUnit_2.TestDescription; } });
Object.defineProperty(exports, "TestDefinition", { enumerable: true, get: function () { return tsUnit_2.TestDefinition; } });
var TestAsync = (function (_super) {
    __extends(TestAsync, _super);
    function TestAsync() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestAsync.prototype.runAll = function (tests, testRunLimiter) {
        var _this = this;
        var thisTest = tests[0];
        var testClass = thisTest.testClass;
        var dynamicTestClass = testClass;
        var testsGroupName = thisTest.name;
        var propertyNames = tsUnit_1.FunctionPropertyHelper.getFunctionNames(testClass);
        var functions = [];
        for (var j = 0; j < propertyNames.length; j++) {
            var unitTestName = propertyNames[j];
            if (!this.isReservedFunctionName(unitTestName) &&
                !(unitTestName.substring(0, this.privateMemberPrefix.length) === this.privateMemberPrefix) &&
                !(typeof dynamicTestClass[unitTestName] !== 'function') &&
                (!testRunLimiter || testRunLimiter.isTestActive(unitTestName))) {
                functions.push(unitTestName);
            }
        }
        var remainingTests = tests.slice(1);
        var promise = this.runAllFunctions(thisTest, functions, testRunLimiter);
        if (remainingTests.length) {
            return promise.then(function () { return _this.runAll(remainingTests, testRunLimiter); });
        }
        return promise;
    };
    TestAsync.prototype.runAllFunctions = function (thisTest, functionNames, testRunLimiter) {
        var _this = this;
        var unitTestName = functionNames[0];
        var remainingFunctions = functionNames.slice(1);
        var testClass = thisTest.testClass;
        var dynamicTestClass = testClass;
        var testsGroupName = thisTest.name;
        var promise;
        if (typeof dynamicTestClass[unitTestName].parameters !== 'undefined') {
            var parameters = dynamicTestClass[unitTestName].parameters;
            promise = this.runAllParameters(thisTest, unitTestName, 0, testRunLimiter);
        }
        else {
            promise = this.runSingleTestAsync(testClass, unitTestName, testsGroupName);
        }
        if (remainingFunctions.length > 0) {
            promise = promise.then(function () { return _this.runAllFunctions(thisTest, remainingFunctions, testRunLimiter); });
        }
        promise.then(function (x) {
            testClass.tearDown && testClass.tearDown();
            return x;
        }, function (err) {
            testClass.tearDown && testClass.tearDown();
            throw err;
        });
        return promise;
    };
    TestAsync.prototype.runAllParameters = function (thisTest, unitTestName, parameterIndex, testRunLimiter) {
        var _this = this;
        var testClass = thisTest.testClass;
        var dynamicTestClass = testClass;
        var testsGroupName = thisTest.name;
        var parameters = dynamicTestClass[unitTestName].parameters;
        var maxIndex = parameters.length - 1;
        var index = parameterIndex;
        if (testRunLimiter) {
            while (index < parameters.length && !testRunLimiter.isParametersSetActive(index)) {
                ++index;
            }
        }
        if (index < parameters.length) {
            return this.runSingleTestAsync(testClass, unitTestName, testsGroupName, parameters, index)
                .then(function () { return _this.runAllParameters(thisTest, unitTestName, index + 1, testRunLimiter); });
        }
        return Promise.resolve(this);
    };
    TestAsync.prototype.runSingleTestAsync = function (testClass, unitTestName, testsGroupName, parameters, parameterSetIndex) {
        var _this = this;
        if (parameters === void 0) { parameters = null; }
        if (parameterSetIndex === void 0) { parameterSetIndex = null; }
        return Promise.resolve().then(function () {
            testClass.setUp && testClass.setUp();
            var dynamicTestClass = testClass;
            var args = (parameterSetIndex !== null) ? parameters[parameterSetIndex] : null;
            return dynamicTestClass[unitTestName].apply(testClass, args);
        }).then(function () {
            _this.passes.push(new tsUnit_1.TestDescription(testsGroupName, unitTestName, parameterSetIndex, 'OK'));
            return _this;
        }, function (err) {
            _this.errors.push(new tsUnit_1.TestDescription(testsGroupName, unitTestName, parameterSetIndex, err.toString()));
            return _this;
        });
    };
    TestAsync.prototype.runAsync = function (testRunLimiter) {
        if (testRunLimiter === void 0) { testRunLimiter = null; }
        var parameters = null;
        var testContext = new tsUnit_1.TestContext();
        if (testRunLimiter == null) {
            testRunLimiter = this.testRunLimiter;
        }
        var tests = this.tests;
        if (testRunLimiter) {
            tests = tests.filter(function (x) { return testRunLimiter.isTestsGroupActive(x.name); });
        }
        return this.runAll(tests, testRunLimiter);
    };
    TestAsync.prototype.run = function () {
        console.log("use runAsync");
        throw new Error("use runAsync");
    };
    return TestAsync;
}(tsUnit_1.Test));
exports.TestAsync = TestAsync;
