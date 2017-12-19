"use strict";
class WordError extends Error {};
class FunctionDefinitionError extends Error {};


class Forth {
    constructor(defineCallback) {
	this.events = new EventEmitter();
	this.stack = new Stack();
	this.reset();
    }
    defineFunction(symbols) {
	var name = symbols[0];
	var defn = symbols.slice(1);


	var forthIf = new Set(["if", "IF"]);
	var forthElse = new Set(["else", "ELSE"]);
	var forthEndif = new Set(["endif", "ENDIF"]);
	var forthReserved = new Set([...forthIf, ...forthElse, ...forthEndif]);

	// returns [function, [symbols]]
	var makeAst = function(symbols) {
	    if (symbols.length == 0) {
		return [function() {}, symbols];
	    }


	    else {
		var first = symbols[0];
		var rest = symbols.slice(1);

		var composed;
		var res;

		// Check if we are parsing an if statement
		if (forthIf.has(first)) {
		    var ifRes = makeIf(symbols);
		    res = makeAst(ifRes[1]); // here
		    composed = function() {
			ifRes[0](this.stack);
			res[0](this.stack);
		    }.bind(this);
		    return [composed, res[1]];
		}

		// Check if we have a number
		else if (!(isNaN(Number(first))) && !(first === "")) {
		    res = makeAst(rest);
		    composed = function() {
			this.stack.push(Number(first));
			res[0](this.stack);
		    }.bind(this);
		}

		// Make sure it's not a reserved word. If not, it is assumed to be a function.
		else if (!forthReserved.has(first)) {
		    res = makeAst(rest);
		    composed = function() {
			this.words[first](this.stack);
			res[0](this.stack);
		    }.bind(this);
		}
		else {
		    // If it isn't any of the above, then the AST parser is done.
		    return [function() {}, symbols];
		}

		return [composed, res[1]]; // if something matched
	    }

	}.bind(this);
	
	var makeIf = function(symbols) {
	    var first = symbols[0];
	    var rest = symbols.slice(1);

	    if (!forthIf.has(first)) {
		throw new FunctionDefinitionError("Expected 'if' but got " + first);
	    }
	    
	    // Right before else
	    var result = makeAst(rest);
	    var ifFunction = result[0];
	    symbols = result[1];
	    first = symbols[0];
	    rest = symbols.slice(1);
	    if (!forthElse.has(first)) {
		throw new FunctionDefinitionError("Expected 'else' but got " + first);
	    }

	    
	    // Right before endif
	    result = makeAst(rest);
	    var elseFunction = result[0];
	    symbols = result[1];
	    first = symbols[0];
	    rest = symbols.slice(1);
	    if (!forthEndif.has(first)) {
		throw new FunctionDefinitionError("Expected 'endif' but got " + first);
	    }


	    var returnFn = function() {
		if (this.stack.pop() !== 0) { // 0 is forth's value for false
		    // true
		    ifFunction();
		}
		else {
		    elseFunction();
		}
	    }.bind(this);

	    return [returnFn, rest];
	}.bind(this);

	var resultList = makeAst(defn);
	if (resultList[1].length == 0) {
	    this.words[name] = resultList[0];
	}
	else {
	    throw new FunctionDefinitionError("Unexpected end of function definition");
	}
	
	this.events.emit("defineFunction", name, this.words[name]);
    }
    reset() {
	this.stack.length = 0;
	this.stack.events.emit('updateStack'); // BAD BAD BAD practice
	this.words = Object.assign({}, words); // Make a copy
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
	    else if (!(isNaN(Number(symbol)))) {
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
   constructor() {
       super(...arguments);
       this.events = new EventEmitter();
   }

    push() {
	var v = super.push.call(this, ...arguments);
	this.events.emit('updateStack');
	return v;
    }
    
    pop() {
	var v;
	if (this.length === 0) {
	    throw new UnderflowError();
	}
	else {
	    v = super.pop.call(this);
	}
	this.events.emit('updateStack');
	return v;
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
	stack.push(a);
	stack.push(b);
    };

    function dup(stack) {
	var a = stack.pop();
	stack.push(a);
	stack.push(a);
    };
    
    return words;
}();
