// See the following on using objects as key/value dictionaries
// https://stackoverflow.com/questions/1208222/how-to-do-associative-array-hashing-in-javascript



// See forth.js for emptyStack

var resetButton = document.querySelector('#reset');

/**
 * Print a string out to the terminal, and update its scroll to the
 * bottom of the screen. You should call this so the screen is
 * properly scrolled.
 * @param {Terminal} terminal - The `terminal` object to write to
 * @param {string}   msg      - The message to print to the terminal
 */
function print(terminal, msg) {
    terminal.print(msg);
    $("#terminal").scrollTop($('#terminal')[0].scrollHeight + 40);
}

/** 
 * Sync up the HTML with the stack in memory
 * @param {Array[Number]} The stack to render
 */
function renderStack(stack) {
    $("#thestack").empty();
    [...stack].reverse().forEach(function(element) {
        $("#thestack").append("<tr><td>" + element + "</td></tr>");
    });
};

/** 
 * Process a user input, update the stack accordingly, write a
 * response out to some terminal.
 * @param {Forth} forth - The forth object to work on
 * @param {Array[string]} symbols - The array of symbols the user typed
 * @param {Terminal} terminal - The terminal object
 */
function process(forth, symbols, terminal) {

    symbols.forEach(function(symbol) {
	if (symbol == ".s") {
	    forth.print(terminal);
	}
	else {
	    try {
		forth.process(symbol);
	    }
	    catch(e) {
		if (e instanceof WordError) {
		    print(terminal, ":-( Unrecognized input");
		}
		else if (e instanceof UnderflowError) {
		    print(terminal, "Stack underflow");
		}
		else if (e instanceof FunctionDefinitionError) {
		    print(terminal, e.message);
		}
		else {
		    throw e;
		}
	    }
	}
    });
}


/**
* Turn the user input string into an array of symbols
* @param {string} input - The user's input string 
*/
function getSymbols(input) {
    return input.trim().split(/\s+/); // Remove whitespace
}

function runRepl(terminal, forth) {
    terminal.input("", function(line) {
    //print(terminal, "User typed in: " + line);
    var symbols = getSymbols(line);
    process(forth, symbols, terminal);
    runRepl(terminal, forth);
    });
};


// Adds a button to the DOM that calls the funciton
function makeOnDefineFunction(forth) {
    return function(name, fn) {
	var b = document.createElement("button");
	b.innerHTML = name;
	
	b.addEventListener("click", fn);
	document.getElementById('user-defined-funcs').append(b);
    };
}


// Whenever the page is finished loading, call this function. 
// See: https://learn.jquery.com/using-jquery-core/document-ready/
$(document).ready(function() {
    var terminal = new Terminal();
    terminal.setHeight("400px");
    terminal.blinkingCursor(true);
    
    // Find the "terminal" object and change it to add the HTML that
    // represents the terminal to the end of it.
    $("#terminal").append(terminal.html);

    var forth = new Forth();
    resetForth(forth, terminal);

    forth.events.on("defineFunction", makeOnDefineFunction(forth));
    forth.stack.events.on("updateStack", function() {renderStack(forth.stack);}); // probably bad practice

    // Event listener for resetting the stack
    resetButton.addEventListener('click', resetForth.bind(this, forth, terminal));
	
    runRepl(terminal, forth);
});

function resetForth(forth, terminal) {
    // Make a forth interpreter an object
    // reset should just make a new one.
    // Then, this would be the constructor (kind of)
    terminal.clear();
    print(terminal, "Welcome to HaverForth! v0.1");
    print(terminal, "As you type, the stack (on the right) will be kept in sync");
    forth.reset();
    
    // https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
    var funcButtons = document.getElementById('user-defined-funcs');
    while (funcButtons.firstChild) {
	funcButtons.removeChild(funcButtons.firstChild);
    }
    
};
