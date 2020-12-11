/**
 * UIKIT Components Initialization
 */
var liveSearchComponent1 = new LiveSeach(
    'livesearch1',
    '/fake-api/fake-data.php?format=plain&search=',
    1,
    null,
    function(res) {
        document.getElementById('livesearch1_result').innerHTML = res;
    }
);

var liveSearchComponent2 = new LiveSeach(
    'livesearch2',
    '/fake-api/fake-data.php?search=',
    2,
    function(obj) {
        return (obj.name + ' <span class="ls_email">' + obj.email + ' de </span><span class="ls_company">' + obj.company + '</span>');
    },
    function(res) {
        document.getElementById('livesearch2_result').innerHTML = res;
    }
);

var liveSearchComponent3 = new LiveSeach(
    'livesearch3',
    '/fake-api/fake-data.php?search=',
    3,
    null,
    function(res) {
        document.getElementById('livesearch3_result').innerHTML = res;
    }
);