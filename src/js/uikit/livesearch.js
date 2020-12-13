/**
 * LiveSearch JS Component Constructor.
 * 
 * JS component as a supposed part of a UIKit with other JS components.
 * 
 * @param {string} elementId ID of the input (type="text") element to become a LiveSearch component.
 * @param {*} apiurl URL / Endpoint of the API to request the filtered data. This endpoint must return a JSON dataset.
 * @param {*} minTypedLength Minimum number of chars that the user must type in order to request data to the endpoint.
 * @param {*} userDefinedFormatFunction Javascript User function to format each result. It will receive a parameter with each data (string or object) and it must return a user-formatted string.
 * @param {*} userDefinedSelectedFunction Javascript User function that will be executed when the user selects an element from the results.
 */
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

    /**
     * Initialization Function.
     * 
     * It will be executed when the object is instantiated.
     */
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

        //Adding a Reference in the main input field to the object itself, to be used when the Event is fired
        this.input._parentobj = this;

        /**
         * Adding 'input' Event Listeners: 
         *  - input, to detect changes typed by the user
         *  - blur, to detect the user has lost focus of the field
         */
        this.eventWrapper(this.input, "input", this.eventInputChanged);
        this.eventWrapper(this.input, "blur", this.eventInputBlur);

        //Creating the Wrapper & Container divs to display results
        this.resultsWrapperContainer = document.createElement('div');
        this.resultsWrapperContainer.className = 'livesearchWrapper';
        this.resultsWrapperContainer.id = 'livesearchWrapper' + this.elementId;

        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'livesearchResContainer';

        //Adding new Elements to DOM
        this.resultsWrapperContainer.appendChild(this.resultsContainer);
        this.input.after(this.resultsWrapperContainer);
    };

    /**
     * Event Wrapper Helper.
     * 
     * @param {DOM Element} element DOM Element to catpure the event.
     * @param {string} event Event name (click, input, change, ...).
     * @param {function} funct JS Function that will be fired on the event
     */
    this.eventWrapper = function(element, event, funct) {
        try {
            element.addEventListener ? element.addEventListener(event, funct, false) : element.attachEvent && element.attachEvent("on" + event, funct);
        } catch (e) {
            this.error(e.message);
        }
    };

    /**
     * Requesting data to the defined API Endpoint.
     * 
     * @param {string} txt String typed by the user to filter data on server side
     */
    this.requestDataFromURL = function(txt) {
        if (this.xmlhttp) {
            this.xmlhttp.abort();
        }
        this.xmlhttp = new XMLHttpRequest();
        var _this = this;

        this.xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                try {
                    var dataJSON = JSON.parse(this.responseText);
                    _this.displayResults(dataJSON);
                } catch (error) {
                    _this.error('Error parsing the JSON response: ' + error.message);
                }
                _this.xmlhttp = null;
                _this.input.classList.remove('loading');
            } else if (this.readyState == 4 && this.status != 200) {
                _this.error('Error on the AJAX request');
                _this.xmlhttp = null;
                _this.input.classList.remove('loading');
                return;
            }
        };
        //Do the XHR request
        try {
            this.xmlhttp.open("GET", this.apiurl + txt, true);
            this.xmlhttp.send();
        } catch (error) {
            this.error('Error on the XHR request: ' + error.message);
        }

    };

    /**
     * Formatting 1 found result (string or Object).
     * 
     * @param {*} resultObj String or Object to be formated (and bolded the found portions) as string, so it will displayed to the user
     */
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

    /**
     * Bolding all substring portions (needle) found in the complete string (haystack).
     * 
     * @param {string} haystack The complete String
     * @param {string} needle The substring to be bolded
     */
    this.boldResult = function(haystack, needle) {
        return haystack.replace(new RegExp('(^|)(' + needle + ')(|$)', 'ig'), '$1<strong>$2</strong>$3');
    };

    /**
     * Creating the DOM components (with its event) to display the found results.
     * 
     * @param {array} results Array of Strings or Objects 
     */
    this.displayResults = function(results) {
        // 1st: To clean the existing list of diplayed results
        this.resultsContainer.innerHTML = '';

        $noresultsfound = true;
        // 2nd: Display results
        if (Object.keys(results).length > 0) {
            $noresultsfound = false;
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
        }

        if ($noresultsfound) {
            /**
             * Creating element to display that there are no results
             */
            var resNoResultsDiv = document.createElement('div');
            resNoResultsDiv.innerHTML = ' - 0 results found - ';
            resNoResultsDiv.className = 'livesearchRes';
            this.resultsContainer.appendChild(resNoResultsDiv);
        }

        // Apply visibility
        this.resultsWrapperContainer.classList.add('displayresults');
    };


    /**
     * Log Function that displays log message in Console.
     * 
     * @param {string} msg 
     */
    this.log = function(msg) {
        console.log('UIKIT LOG :: ' + msg);
    };

    /**
     * Error Function that displays error message in Console.
     * 
     * @param {string} msg 
     */
    this.error = function(msg) {
        console.error('UIKIT Error :: ' + msg);
    };

    /**
     * Event to be fired when the input field is updated by the user.
     * 
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

    /**
     * Blur Event Manager fired when the user looses the focus of the field.
     * 
     * @param {event} event Event provided by the browser
     */
    this.eventInputBlur = function(event) {
        this.classList.remove('loading');
        this._parentobj.resultsWrapperContainer.classList.remove('displayresults');
    };

    /**
     * Click Event Manager fired when the user clicks on a result.
     * 
     * @param {event} event Event provided by the browser
     */
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