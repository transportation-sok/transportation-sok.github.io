var filters = {};
var old_data = null;
var bib = {};
var sok_data = new Map();
var new_data = [];
var cats = ["Component: ", "Technology: ", "Attack Category: ", "Mitigation: "];

d3.csv("bib.csv", function (bibtmp) {
    bibtmp.forEach(function (b) {
        bib[b["ID"]] = b;
    });
    d3.csv("papers.csv", function (dtmp) {
        old_data = dtmp;
        // ------------------------------------------------------------
        // Create filters for all categories in SoK "cats"
        // ------------------------------------------------------------
        initFilters();
        updatePapers();
        // ------------------------------------------------------------

        // Find all category columns
        var all_cat_cols = new Map();
        // Initialize it with cats
        cats.forEach(function(cat){
            all_cat_cols.set(cat, []);
        });

        old_data.columns.forEach(function(col){
            cats.forEach(function(cat){
                if (col.startsWith(cat)) {
                    all_cat_cols.get(cat).push(col);
                }
            });
        });

        dtmp.forEach(function (p) {
            var b = bib[p["Bibref"]];
            new_data.push({...p, ...b});

            // Build sok_data
            paper_sok = new Map();
            // forEach over Map gives value as the first argument and key as
            // second.
            all_cat_cols.forEach(function (cat_types, cat) {
                //paper_sok[cat] = [];
                paper_sok.set(cat, []);

                cat_types.forEach(function (ct) {
                    if (p[ct].length > 0) {
                        paper_sok.get(cat).push(ct.substring(cat.length));
                    }
                });
            });

            sok_data.set(p["Bibref"], paper_sok);
        });

        var venue = {};
        var authors = {};

        new_data.forEach(function (p) {
            var v = p["booktitle"] + p["journal"];
            // Skip if we do not have a venue.
            // Currently, this happens for the books.
            if (!v) return;

            if (venue[v] == null) venue[v] = 0;
            venue[v]++;

            p["author_list"] = [];
            p["author"].split(";").forEach(function (_a) {
                var a = _a.trim();
                p["author_list"].push(a);
                if (authors[a] == null) authors[a] = 0;
                authors[a]++;
            });
        });

        venuesSorted = Object.keys(venue).sort(function (a, b) {return venue[b] - venue[a]});
        authorsSorted = Object.keys(authors).sort(function (a, b) {return authors[b] - authors[a]});
        authorSubset = authorsSorted.slice(0, 30).sort();
        authorOther = authorsSorted.slice(30);

        var form = document.getElementById("filterForm");

        // ------------------------------------------------------------
        // at: Create filter for "Venues"
        // ------------------------------------------------------------
        var catDiv = document.createElement("div");
        catDiv.className = "card mb-2 shadow-sm";
        form.appendChild(catDiv);

        // at: card-header wrapper div.
        var formHeader = document.createElement("div");
        formHeader.className = "p-2 card-header";
        formHeader.innerHTML = '<strong><a name="filter_venue"></a>Venue: ( <a href="#filter_venue" onclick="selectAll(\'venue\');">all</a> | <a href="#filter_venue" onclick="selectNone(\'venue\');">none</a> )</strong>';
        // at: Compose the card.
        catDiv.appendChild(formHeader);

        // at: Card body wrapper div
        var cardBody = document.createElement("div");
        cardBody.className = "p-2 card-body";

        var category = "venue";

        filters[category] = {};

        venuesSorted.forEach(function (v) {
            var myName = v;

            var formInput = createInputCheckbox(myName);
            var formLabel = createInputLabel(myName, myName);
            var formGroup = createDiv("form-check", [formInput, formLabel]);
            cardBody.appendChild(formGroup);

            filters[category][myName] = {};
            filters[category][myName]["input"] = formInput;
            filters[category][myName]["label"] = formLabel;
            filters[category][myName]["filterFunc"] = function (paper) {
                return formInput.checked && (paper['journal'] == myName || paper['booktitle'] == myName);
            };
            filters[category][myName]["updateLabel"] = function (reset_cnt) {
                formLabel.innerHTML = myName + " (" + filters[category][myName]["count"] + ")";
                if (reset_cnt) {filters[category][myName]["count"] = 0;}
            };
            filters[category][myName]["count"] = 0;

        });
        // at: Compose the card.
        catDiv.appendChild(cardBody);

        // Starting new scope.
        /*
                {
                    // --------------------------------------------------------
                    // at: Create filter for "Authors".
                    // --------------------------------------------------------
                    // at: Create div for each category
                    var authorDiv = document.createElement("div");
                    authorDiv.className = "card mb-2 shadow-sm";
                    form.appendChild(authorDiv);

                    // at: card-header wrapper div
                    var authorHeader = document.createElement("div");
                    authorHeader.className = "p-2 card-header";
                    authorHeader.innerHTML = '<strong><a name="filter_author"></a>Authors: ( <a href="#filter_author" onclick="selectAll(\'authors\');">all</a> | <a href="#filter_author" onclick="selectNone(\'authors\');">none</a> )</strong>';
// at: Compose the card
                    authorDiv.appendChild(authorHeader);

                    // at: Card body wrapper div
                    var cardBody = document.createElement("div");
                    cardBody.className = "p-2 card-body";
                    var Acategory = "authors";

                    filters[Acategory] = {};

                    authorSubset.forEach( function(myName){
                        var formInput = createInputCheckbox( myName );
                        var formLabel = createInputLabel( myName, myName );
                        var formGroup = createDiv( "form-check", [formInput,formLabel]);

                    // at: collect to card-body and then compose into the card.
                        cardBody.appendChild(formGroup);

                        filters[Acategory][myName] = {};
                        filters[Acategory][myName]["input"]		 =	formInput;
                        filters[Acategory][myName]["label"]		 =	formLabel;
                        filters[Acategory][myName]["filterFunc"]  =	function(paper){
                            return formInput.checked && ( paper['author_list'].includes(myName) );
                        };
                        filters[Acategory][myName]["updateLabel"] =	function(reset_cnt){
                            formLabel.innerHTML = myName + " (" + filters[Acategory][myName]["count"] + ")";
                            if(reset_cnt){ filters[Acategory][myName]["count"] = 0; }
                        };
                        filters[Acategory][myName]["count"]		 =	0;
                    });

// at: Add other authors category
                    var others = "Other Authors";
                    var formInput = createInputCheckbox( others );
                    var formLabel = createInputLabel( others, others );
                    var formGroup = createDiv( "form-check", [formInput,formLabel]);
                    cardBody.appendChild(formGroup);

// at: Compose the card
                    authorDiv.appendChild(cardBody);

                    filters[Acategory][others] = {};
                    filters[Acategory][others]["input"]		 =	formInput;
                    filters[Acategory][others]["label"]		 =	formLabel;
                    filters[Acategory][others]["filterFunc"]  =	function(paper){
                        if( !formInput.checked ) return false;
                        for( i in paper['author_list'] ){
                            if( authorOther.includes( paper['author_list'][i] ) ) return true;
                        }
                        return false;
                    };
                    filters[Acategory][others]["updateLabel"] =	function(reset_cnt){
                        formLabel.innerHTML = others + " (" + filters[Acategory][others]["count"] + ")";
                        if(reset_cnt){ filters[Acategory][others]["count"] = 0; }
                    };
                    filters[Acategory][others]["count"]		 =	0;

                }
    */
        updatePapers();
    });
});

function initFilters( ){
    var form = document.getElementById("filterForm");

    cats.forEach( function(category){
        filters[category] = {};

        // at: Create div for each category.
        var catDiv = document.createElement("div");
        catDiv.className = "card mb-2 shadow-sm";
        form.appendChild(catDiv);

        // at: card-header wrapper div.
        var formHeader = document.createElement("div");
        formHeader.className = "p-2 card-header";
        formHeader.innerHTML = '<strong><a name="cat_' + category + '"></a>' + category + ' ( <a href="#" onclick="selectAll(\'' + category + '\');">all</a> | <a href="#" onclick="selectNone(\'' + category + '\');">none</a> )</strong>';

        // at: Compose the card.
        catDiv.appendChild(formHeader);

        // at: Card body wrapper div
        var cardBody = document.createElement("div");
        cardBody.className = "p-2 card-body";

        old_data.columns.forEach( function(d){
            if( !d.startsWith(category) ) return;

            var myName = d.substring( category.length );

            var formInput = createInputCheckbox( d );
            var formLabel = createInputLabel( d, myName );
            var formGroup = createDiv( "form-check", [formInput,formLabel]);

            filters[category][myName] = {};
            filters[category][myName]["input"]		 =	formInput;
            filters[category][myName]["label"]		 =	formLabel;
            filters[category][myName]["filterFunc"]  =	function(paper){
                return ( formInput.checked && (paper[d].length>0) )
            };
            filters[category][myName]["updateLabel"] =	function(reset_cnt){
                formLabel.innerHTML = myName + " (" + filters[category][myName]["count"] + ")";
                if(reset_cnt){ filters[category][myName]["count"] = 0; }
            };
            filters[category][myName]["count"]		 =	0;

            // at: collect to card-body and then compose into the card.
            cardBody.appendChild(formGroup);
            //catDiv.appendChild(formGroup);
        });

        // at: Compose the card.
        catDiv.appendChild(cardBody);
    });
}

function selectAll( category ){
    for (filter in filters[category]) {
        filters[category][filter]["input"].checked = true;
    }
    updatePapers( );
}

function selectNone( category ){
    for (filter in filters[category]) {
        filters[category][filter]["input"].checked = false;
    }
    updatePapers( );
}

function filterPapers( ){
    ret = [];
    new_data.forEach( function(d){
        var include = true;
        for (filterGrp in filters) {
            var includeG = false;
            for (filter in filters[filterGrp]) {
                includeG = includeG || filters[filterGrp][filter]["filterFunc"](d);
            }
            include = include && includeG;
        }
        if( include ){
            ret.push(d);
        }
    });
    return ret;
}

function updateFilters( filteredPapers ){
    filteredPapers.forEach( function(d){
        for (filterGrp in filters) {
            for (filter in filters[filterGrp]) {
                if( filters[filterGrp][filter]["filterFunc"](d) ){
                    filters[filterGrp][filter]["count"]++;
                }
            }
        }
    });

    for (filterGrp in filters) {
        for (filter in filters[filterGrp]) {
            filters[filterGrp][filter]["updateLabel"]( true );
        }
    }
}

function createInputCheckbox( id_val ){
    var formInput = document.createElement("input");
    formInput.className = "form-check-input";
    formInput.type      = "checkbox";
    formInput.value     = id_val;
    formInput.id        = id_val;
    formInput.checked   = true;
    formInput.onclick   = function(){ updatePapers() };
    return formInput;
}

function createInputLabel( for_id, innerHTML ){
    var formLabel = document.createElement("label");
    formLabel.className = "form-check-label";
    formLabel.htmlFor   = for_id;
    formLabel.innerHTML = innerHTML;
    return formLabel;
}

function createDiv( className, children ){
    var formGroup = document.createElement("div");
    formGroup.className = className;

    children.forEach( function(child){
        formGroup.appendChild(child);
    });
    return formGroup;
}

function updatePapers( curr_filters ){
    var papers = document.getElementById("papers");
    papers.innerHTML = null;

    var rowDiv = null;
    var curr = 0;
    //var numCardsInOneRow = 3;
    var numCardsInOneRow = 1;
    filteredPapers = filterPapers( );

    filteredPapers.forEach( function(curPaper){
        if( curr%numCardsInOneRow == 0 ){
            // Start a new row.
            rowDiv = document.createElement("div");
            rowDiv.className = "row";
            papers.appendChild( rowDiv );
        }
        curr++;

        // at: Create html section for paper title.
        var paperTitleHTML = `
                              <h6 class="card-title">
                                  ${curPaper["title"]}
                                  <span>
        `;

        // at: Optionally add a link to the paper
        if (curPaper["url"]) {
            paperTitleHTML += `
                                        <a href="${curPaper["url"]}" target="_blank">
                                        <i class="fa fa-link fa-fw"></i>
                                        </a>
                    `;
        }

        // at: Continue building html for paper title
        paperTitleHTML += `                 </span>
                              </h6>
        `;

        // at: Create card with tabs for description.
        // Replacing ':' as it is causing issues with html tag id generation.
        var paperId = `paper-${curPaper["ID"]}`.replaceAll(':', '');

        html = `
                <div class="col-md-12">
                    <div class="card mb-2">
                        <div class="card-header">
                            <ul class="nav nav-tabs card-header-tabs" id="${paperId}-tab" role="tablist" style="margin-top: -8px;">
                                <li class="nav-item">
                                    <a class="nav-link active" id="${paperId}-description-tab" data-toggle="tab" href="#${paperId}-description" role="tab" aria-controls="One" aria-selected="true">
                                        Paper Details
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" id="${paperId}-analysis-tab" data-toggle="tab" href="#${paperId}-analysis" role="tab" aria-controls="Two" aria-selected="false">
                                        SoK
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div class="tab-content" id="${paperId}-tabContent">
                            <div class="tab-pane fade show active p-3" id="${paperId}-description" role="tabpanel" aria-labelledby="${paperId}-description-tab">
                                ${paperTitleHTML}
                                <span><span style="font-weight:bold">Venue: </span>
                                    ${curPaper["booktitle"] + curPaper["journal"] + ', ' + curPaper["year"]}
                                </span>
                                </br>
                                <span>
                                    <span style="font-weight:bold">Authors: </span>
                                    ${curPaper["author"]}
                                </span>
                            </div>
        `;

        // at: Build the SoK card from sok_data
        html += `
                            <div class="tab-pane fade p-3" id="${paperId}-analysis" role="tabpanel" aria-labelledby="${paperId}-analysis-tab">
                                ${paperTitleHTML}
                                <p class="card-text">
        `;

        sok_data.get(curPaper["Bibref"]).forEach(function(sok_cats, cat) {
            var sok = sok_cats.join(', ');
            html += `
                                    <span><span style="font-weight:bold">${cat} </span>
                                        ${sok}
                                    </span>
                                    </br>
            `;
        });

        // at: Continue building the rest of the html for current paper
        html += `
                                </p>
                            </div> <!-- sok card ends here. -->
                        </div>

                    </div>
                </div>
                `;

        rowDiv.innerHTML += html;
    });

    updateFilters( filteredPapers );
}

