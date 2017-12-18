"use strict";
class WordError extends Error {};



class Forth {
    constructor(defineCallback) {
	this.reset();
	this.events = new EventEmitter();
    }
    defineFunction(symbols) {
	var name = symbols[0];
	var defn = symbols.slice(1);

	this.words[name] = function(stack) {

	    defn.forEach(function(symbol) {
		this.process(symbol);
	    }.bind(this));

	}.bind(this);

	this.events.emit("defineFunction", name, this.words[name]);
    }
    reset() {
	this.stack = new Stack();
	this.words = Object.assign({}, words);
	this.definingFunction = false;
	this.functionSymbols = [];

    }

    print(terminal) {
        terminal.print(" <" + this.stack.length + "> " + this.stack.join(" "));
    }
    process(symbol) {

	if (symbol == ":") {
	    this.definingFunction = true;
	    this.functionSymbols = [];
	    return;
	    // Doesn't allow nested definitions
	}
	else if (symbol == ";") {
	    this.definingFunction = false;
	    this.defineFunction(this.functionSymbols);
	    return;
	}


	if (this.definingFunction) {
	    this.functionSymbols.push(symbol);
	}
	else {
	    if (symbol == "") {
		// empty string is not zero!
	    }
	    if (!(isNaN(Number(symbol)))) {
		//print(terminal,"pushing " + Number(symbol));
		this.stack.push(Number(symbol));
	    } else if (symbol === ".s") {

	    } else if (this.words.hasOwnProperty(symbol)) {
		// Don't use the 'in' keyword. It follows the prototype chain
		this.words[symbol](this.stack);
	    } else {
		throw new WordError("Unknown Word");
	    }
	}

    }
}

class UnderflowError extends Error {}

class Stack extends Array {
//    constructor() {
//	super(...arguments);
//    }

    pop() {
	if (this.length === 0) {
	    throw new UnderflowError();
	}
	else {
	    return super.pop.call(this);
	}
    }
}


var words = function() {
    var FORTH_FALSE = 0;
    var FORTH_TRUE = -1;
    
    var words = {
	"+" : add,
	"-" : sub,
	"*" : mul,
	"/" : div,
	nip : nip,
	over : over,
	swap : swap,
	"<" : less,
	">" : greater,
	"=" : equal,
	drop : drop,
	dup : dup
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
	applyBinary(stack, function(a,b) {return b-a;});
    };

    function mul(stack) {
	applyBinary(stack, function(a,b) {return b*a;});
    };

    function div(stack) {
	applyBinary(stack, function(a,b) {return b/a;});
    };

    function nip(stack) {
	applyBinary(stack, function(a,b) {return a;});
    };
    
    function over(stack) {
	var a = stack.pop();
	var b = stack.pop();
	stack.push(b);
	stack.push(a);
	stack.push(b);
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

    function drop(stack) {
	stack.pop();
    }
    
    function swap(stack) {
	var a = stack.pop();
	var b = stack.pop();
	stack.push(b);
	stack.push(a);
    };

    function dup(stack) {
	var a = stack.pop();
	stack.push(a);
	stack.push(a);
    };
    
    return words;
}();
