function defined(a) {
	return (a !== undefined);
}

function isNull(a) {
	return (a === null);
}

function sprintfTime(time) {
	if (!defined(time) || time == Infinity || isNaN(time) || isNull(time)) {
		return "----";
	}
	var min = (time / 60) | 0;
	var sec = time % 60;
	var secFraction = time % 1;
	if (min === 0) {
		return sprintf("%2d", sec) + sprintf("%.1f", secFraction).substr(1) + "s";
	} else {
		return (sprintf("%d", min) + ":" + sprintf("%02d", (sec)));
	}
}

function all(predicate, arr) {
	var result = true;
	for (var i = 0; i < arr.length; i++) {
		result = result && predicate(arr[i]);
	}
	return result;
}

function loop(n) {
	return function(f) {
		for (var i = 0; i < n; i++) {
			f(i);
		}
	};
}

function map(arr) {
	return function(f) {
		var result = [];
		loop(arr.length)(function(i) {
			result[i] = f(arr[i]);
		});
		return result;
	};
}

function count(n) {
	var arr = [];
	for (var i = 0; i < n; i++) {
		arr[i] = i;
	}
	return arr;
}

function callbackNthTime(n, callback) {
	var f = {
		call: function() {
			f.receivedCalls++;
			console.log(f + " called x" + f.receivedCalls);
			if (!f.hasExecuted && f.receivedCalls >= f.expectedCalls) {
				console.log(f + " executing!");
				f.hasExecuted = true;
				callback();
			}
		}
	};
	f.hasExecuted = false;
	f.expectedCalls = n;
	f.receivedCalls = 0;
	f.callback = callback;
	return f.call;
}

function loopDelay(n, timeout, callback) {
	return function(f) {
		var functions = map(count(n))(function(i) {
			window.setTimeout(function() {
				f(i);
			}, timeout * i);
		});
		append(functions, function() {
			window.setTimeout(function() {
				console.log("" + new Date());
				callback();
			}, timeout * n);
		});
		chain(functions)();
	};
}

function loop2Delay(n1, n2, timeout) {
	return function(f) {
		return loopDelay(n1, 0)(function(i1) {
			loopDelay(n2, timeout)(function(i2) {
				f(i1, i2);
			});
		});
	};
}

function chain(fArray) {
	return function() {
		if (fArray.length === 0) {
			return;
		}
		f = fArray[0];
		if (defined(f) && typeof f == "function") {
			f();
		}
		chain(fArray.slice(1))();
	};
}

function loop2(n1, n2) {
	return function(f) {
		return loop(n1)(function(i1) {
			loop(n2)(function(i2) {
				f(i1, i2);
			});
		});
	};
}

function append(arr, item) {
	arr[arr.length] = item;
}

function sum(arr) {
	var total = 0;
	loop(arr.length)(function(i) {
		total += arr[i];
	});
	return total;
}

function average(arr) {
	return (sum(arr) / arr.length);
}
iPhone = {
	version: {
		safari: (/AppleWebKit\/([^\s]+)/.exec(navigator.userAgent) || [, false])[1],
		webkit: (/Safari\/(.+)/.exec(navigator.userAgent) || [, false])[1]
	},
	orientChange: function(p, l, r) {
		p = p || function() {};
		l = l || p;
		r = r || l;
		window.onorientationchange = function(orientation) {
			switch (orientation) {
				case 0:
				case "Portrait":
					p();
					break;
				case "LandscapeLeft":
				case 90:
					l();
					break;
				case "LandscapeRight":
				case -90:
					r();
					break;
				case "UpsideDown":
				case "FaceDown":
				case "FaceUp":
					alert("Hey cool: " + orientation);
			}
		};
	},
	hideURLbar: function(f) {
		if (window.innerHeight < (window.outerHeight + 20)) {
			jQuery("html").css({
				"min-height": (window.outerHeight + 20) + "px"
			});
		}
		setTimeout(function() {
			if (window.pageYOffset < 1 || f) {
				window.scrollTo(0, 1);
				jQuery.iPhone.hideURLbar();
			}
		}, 0);
	},
	disableTextSizeAdjust: function() {
		jQuery("html").css({
			"-webkit-text-size-adjust": "none"
		});
	},
	enableTextSizeAdjust: function() {
		jQuery("html").css({
			"-webkit-text-size-adjust": "auto"
		});
	},
	preventTouchMove: function() {
		document.addEventListener("touchmove", function(e) {
			e.preventDefault();
		}, false);
	}
};
