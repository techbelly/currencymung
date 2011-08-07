var currencyRegExp = new RegExp('(\u00A3|\\$)(\\d[\\d,\.]*)\\s?((bn)|(billion)|(m)|(million)|(k)|(thousand)|(trillion)|(tn))?');

var conversion_factors = {
	"teachers" : { "text": "the cost of employing [[number]] new teachers", "factor": 20427 },
	"schools" : {"text": "the cost of building [[number]] new schools", "factor": 25000000},
	"per uk person" : {"text": "£[[number]] for every man, woman and child in the UK", "factor": 66000000},
	"afghanistan": {"text": "[[number]]% of the uk operational cost of the Afghanistan war", "factor": 7440000},
	"wispa": {"text": "the cost of [[number]] Wispas", "factor": 0.80},
	"pound years": {"text": "£1 every second for [[number]] years", "factor": 31556926 },
	"tonnes of pennies": {"text": "[[number]] tonnes of pennies", "factor": 2857},
	"ross years": {"text": "[[number]] years of Jonathan Ross's salary", "factor": 6000000},
	"ten pound notes": {"text": "[[number]]% of ten pound notes in circulation", "factor": 560000000}
};

var currency_munger = {
	
	remove_previous: function() {
		var equivalents = document.evaluate("//span[@class='money_equivalent']", document.body,
							   null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		for (var i = 0; i < equivalents.snapshotLength; i++) {
			var equivalent = equivalents.snapshotItem(i);
			equivalent.parentNode.removeChild(equivalent);
		};
	},
	
	human_readable: function(number) {
		var suffix = '';
		if (number > Math.pow(10,12)) {
			suffix = ' trillion';
			number = number / Math.pow(10,12);
		};
		if (number > Math.pow(10,9)) {
			suffix = ' billion';
			number = number / Math.pow(10,9);
		};
		if (number > Math.pow(10,6)) {
			suffix = ' million';
			number = number / Math.pow(10,6);
		};
		number = Math.round(number*100)/100 // two decimal digits
	    number += ''; // must be a better way to convert to a string?
	    parts = number.split('.');
	    whole_num = parts[0];
	    decimal = parts.length > 1 ? '.' + parts[1] : '';
	    var regexp = /(\d+)(\d{3})/;
	    while (regexp.test(whole_num))
	        whole_num = whole_num.replace(regexp, '$1' + ',' + '$2');
	    return  whole_num + decimal + suffix;
	},
	
	munge: function(matches,requested_scale,article) {
		amount = parseFloat(matches[2].replace(/,/g,''));

		if (matches[1] == '$') {
			amount = amount * 0.68 // dollar pound exchange rate
		}
		
		switch (matches[3]) {
			case 'trillion': 
			case 'tn':
				amount = amount * Math.pow(10,12); break;
			
			case 'billion':
			case 'bn': amount = amount * Math.pow(10,9); break;
			
			case 'million':
			case 'm': amount = amount * Math.pow(10,6); break;
			
			case 'thousand':
			case 'k': amount = amount * Math.pow(10,3); break;
		}
		
		var scale = conversion_factors[requested_scale]
		var factor = scale["factor"];
		var number = Math.round(amount / factor);
		var text = scale["text"].replace('[[number]]',currency_munger.human_readable(number));
		if (number > 0) {
			var equivalent = " ("+text+") ";
			var insert = document.createElement('span');
			insert.className = "money_equivalent";
			insert.appendChild(document.createTextNode(equivalent));
			article.parentNode.insertBefore(insert,article);
		}
	},
	
	replace_numbers: function(requested_scale) {
		currency_munger.remove_previous();
		var articleDivX = document.evaluate("//text()[ancestor::div]", document.body,
							   null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		for (var i = 0; i < articleDivX.snapshotLength; i++) {
			var article = articleDivX.snapshotItem(i);
			var articleText = article.nodeValue;
			var matches = currencyRegExp.exec(articleText);
			while (matches) {
				var searchIndex = matches.index;
				article.splitText(searchIndex + matches[0].length);
				article = article.nextSibling;
									
				currency_munger.munge(matches,requested_scale,article);
				
				articleText = article.nodeValue; 
				matches = currencyRegExp.exec(articleText);
			}
		}
	}
};

function processRequest(request, sender, sendResponse) {
		switch(request.command)
		{
			case("getSettings"):
				sendResponse(conversion_factors);
				return;
			case("highlight"):
			  currency_munger.replace_numbers(request.value);
			  break;
			case("clear"):
			  currency_munger.remove_previous();
			  break;
		}

		sendResponse({});		

}

chrome.extension.onRequest.addListener(processRequest);
