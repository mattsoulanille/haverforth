"use strict";
var words = function() {
    var FORTH_FALSE = 0;
    var FORTH_TRUE = -1;
    
    var words = {
	add : add,
	sub : sub,
	nip : nip,
	over : over,
	swap : swap,
	"<" : less,
	">" : greater,
	"=" : equal
    };
    
    // js bool -> forth bool
    function translateBool(b) {
	if (b) {
	    return FORTH_TRUE;
	}
	else {
	    return FORTH_FALSE;
	}
	
    }
    
    function applyBinary(stack, func) {
	var a = stack.pop();
	var b = stack.pop();
	stack.push(func(a,b));    
    };
    
    function add(stack) {
	applyBinary(stack, function(a,b) {return a+b;});
    };
    
    function sub(stack) {
	applyBinary(stack, function(a,b) {return a-b;});
    };
    
    function nip(stack) {
	applyBinary(stack, function(a,b) {return a;});
    };
    
    function over(stack) {
	stack.push(stack[stack.length - 2]);
    }
    
    function less(stack) {
	applyBinary(stack, function(a,b) {
	    return translateBool(b < a);
	});
    }
    
    function greater(stack) {
	applyBinary(stack, function(a,b) {
	    return translateBool(b > a);
	});
    }
    
    function equal(stack) {
	applyBinary(stack, function(a,b) {
	    return translateBool(b === a);
	});
    }
    
    
    function swap(stack) {
	var a = stack.pop();
	var b = stack.pop();
	stack.push(b);
	stack.push(a);
    };
    return words;
}();
