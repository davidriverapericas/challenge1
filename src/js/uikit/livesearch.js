function LiveSeach(elementId, apiurl, minTypedLength, userDefinedFormatFunction, userDefinedSelectedFunction) {
    this.elementId = elementId;
    this.apiurl = apiurl ? apiurl : null;
    this.minTypedLength = minTypedLength ? minTypedLength : 2;
    this.xmlhttp = null;
    this.input = null;
    this.resultsWrapperContainer = null;
    this.resultsContainer = null;
    this.userDefinedFormatFunction = (typeof userDefinedFormatFunction === 'function') ? userDefinedFormatFunction : null;
    this.userDefinedSelectedFunction = (typeof userDefinedSelectedFunction === 'function') ? userDefinedSelectedFunction : null;
    this._this = this;

    this.init = function() {
        /**
         * Validations on elementId Field:
         *  - It must exists
         *  - It must be a html input[type="text"] field
         */
        if (!(this.input = document.getElementById(this.elementId))) {
            error("ElementId '" + this.elementId + "' not found in DOM");
            return;
        }
        if (this.input.nodeName.toUpperCase() !== 'INPUT') {
            error("ElementId '" + this.elementId + "' is not an input field");
            return;
        }
        if (this.input.type.toUpperCase() !== 'TEXT') {
            error("ElementId '" + this.elementId + "' is not an input[type='text'] field");
            return;
        }
        if (apiurl === null || apiurl.length == 0) {
            error("APIURL parameter not defined properly");
            return;
        }

        //Adding CSS Class to input
        this.input.classList.add('livesearch');


        this.input._parentobj = this; //

        /**
         * Adding 'input' event: 
         *  - input, to detect changes typed by the user
         *  - blur, to detect the user has lost focus of the field
         */
        this.eventWrapper(this.input, "input", this.eventInputChanged);
        this.eventWrapper(this.input, "blur", this.eventInputBlur);

        //Creating the Wrapper & Container to display results
        this.resultsWrapperContainer = document.createElement('div');
        this.resultsWrapperContainer.className = 'livesearchWrapper';
        this.resultsWrapperContainer.id = 'livesearchWrapper' + this.elementId;

        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'livesearchResContainer';

        //Adding new Elements to DOM
        this.resultsWrapperContainer.appendChild(this.resultsContainer);
        this.input.after(this.resultsWrapperContainer);
    };

    /*
     * Event Wrapper
     */
    this.eventWrapper = function(element, event, funct) {
        try {
            element.addEventListener ? element.addEventListener(event, funct, false) : element.attachEvent && element.attachEvent("on" + event, funct);
        } catch (e) {
            this.error(e.message);
        }
    };

    this.requestDataFromURL = function(txt) {
        if (this.xmlhttp) {
            this.xmlhttp.abort();
        }
        this.xmlhttp = new XMLHttpRequest();
        var _this = this;

        this.xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var dataJSON = JSON.parse(this.responseText);
                _this.displayResults(dataJSON);
                this.xmlhttp = null;
                _this.input.classList.remove('loading');
            } else if (this.readyState == 4 && this.status != 200) {
                error('Error on the AJAX request');
                this.xmlhttp = null;
                _this.input.classList.remove('loading');
                return;
            }
        };
        this.xmlhttp.open("GET", this.apiurl + txt, true);
        this.xmlhttp.send();
    };

    this.formatResult = function(resultObj) {
        var searchTxt = this.input.value;
        if (typeof resultObj === 'string') {
            /**
             * Formating STRING results
             */
            return (this.boldResult(resultObj, searchTxt));
        } else if (this.userDefinedFormatFunction) {
            /**
             * Formating with USER DEFINED FUNCTION
             */
            var formattedText = this.userDefinedFormatFunction(resultObj);
            return (this.boldResult(formattedText, searchTxt));
        } else if (typeof resultObj === 'object') {
            /**
             * Formating OBJECTS results
             */
            var objectToText = '';
            for (var propt in resultObj) {
                objectToText += (objectToText != '') ? ' ' : '';
                objectToText += '<strong>' + propt + '</strong>: ' + resultObj[propt];
            }
            return (this.boldResult(objectToText, searchTxt));
        }
    };

    this.boldResult = function(haystack, needle) {
        return haystack.replace(new RegExp('(^|)(' + needle + ')(|$)', 'ig'), '$1<strong>$2</strong>$3');
    }

    this.displayResults = function(results) {
        // 1st: To clean the existing list of diplayed results
        this.resultsContainer.innerHTML = '';

        // 2nd: Display results
        for (var key in results) {
            if (results.hasOwnProperty(key)) {
                /**
                 * Creating elements to display and manage each result
                 */
                var element = results[key];
                var resDiv = document.createElement('div');
                resDiv.innerHTML = this.formatResult(element);
                resDiv.className = 'livesearchRes';
                resDiv._parentobj = this;
                this.resultsContainer.appendChild(resDiv);
                // Assign event to get the result when the user clicks
                this.eventWrapper(resDiv, "mousedown", this.clickResult);
            }
        }

        // Apply visibility
        this.resultsWrapperContainer.classList.add('displayresults');
    };


    /**
     * Log Function that displays log message in Console
     * @param {string} msg 
     */
    this.log = function(msg) {
        console.log('UIKIT LOG :: ' + msg);
    };

    /**
     * Error Function that displays error message in Console
     * @param {string} msg 
     */
    this.error = function(msg) {
        console.error('UIKIT Error :: ' + msg);
    };

    /**
     * Event to be fired when the input field is updated by the user
     * @param {event} event 
     */
    this.eventInputChanged = function(event) {
        if (this.value.length >= minTypedLength) {
            /**
             * Input has some typed text
             */
            this.classList.add('loading');
            this._parentobj.requestDataFromURL(this.value);
        } else {
            /**
             * Input is empty:
             *  - Remove 'loading' class
             *  - Hide list of results
             */
            this.classList.remove('loading');
            this._parentobj.resultsWrapperContainer.classList.remove('displayresults');
        }
    };

    this.eventInputBlur = function(event) {
        this.classList.remove('loading');
        this._parentobj.resultsWrapperContainer.classList.remove('displayresults');
    };

    this.clickResult = function(event) {
        //Setting the input values of the clicked Result
        var div = document.createElement("div");
        div.innerHTML = this.innerHTML;
        var text = div.textContent || div.innerText || '';
        this._parentobj.input.value = text;

        /**
         * Fire the userDefinedSelectedFunction if defined
         */
        if (userDefinedSelectedFunction) {
            userDefinedSelectedFunction(text);
        }
    };

    //Initialization
    this.init();
}