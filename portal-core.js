var ALYAForm = ALYAForm || {    
    
    meta: null,
    
    addEventFunction(attr, eventName, fn) {
        try {
            let el = document.getElementById(attr);
            if(!el) throw new Error(`No field exists with id: ${attr}`);

            el.removeEventListener(eventName, fn);
            el.addEventListener(eventName, fn);
        } catch (e) {
            console.log("Portal Error: ", e);
        }
    },

    getTab(name){
        return ALYAForm.map.getTab(name);
    },
    getActiveTab(){
        return ALYAForm.map.getActiveTab();
    },
    getSection(name){
        return ALYAForm.map.getSection(name);
    },
    getControl(name){
        return ALYAForm.map.getControl(name);
    },
    getButton(title, includeSubmit){
        return ALYAForm.map.getButton(title, includeSubmit);
    },
    getAllControls(){
        return ALYAForm.map.getAllControls();
    },

    getLookup(attr){
        let lookup = this.getControl(attr);
        if(lookup) return lookup.getValue();
    },
    getString(attr, findInEl) {
        return ALYAForm.html.getElement(attr, "input", "text", findInEl).value;
    },

    getCheckbox(attr, findInEl) {
        return ALYAForm.html.getElement(attr, "input", "checkbox", findInEl).checked;
    },

    getOptionset(attr, findInEl) {
        let ddl = ALYAForm.html.getElement(attr, "select", null, findInEl);
        if(!ddl) return null;
        
        return { 
			value: ddl.options[ddl.selectedIndex].value,
			display: ddl.options[ddl.selectedIndex].text
		}
    },

    setLabel(controlName, newLabelText) {
        let ctl = ALYAForm.map.getControl(controlName);
        if(ctl) ctl.elLabel.innerText = newLabelText;
    },

    setDate(attr, value, includeTime, findInEl) {
        if(!includeTime) includeTime = false;
        let dateValue = new Date(value);
        if(dateValue instanceof Date) {
            // form submit hidden control
            let submitInput = ALYAForm.html.getElement(attr, "input", "text", findInEl);   
            let type = submitInput.dataset.type;
            let behavior = submitInput.dataset.behavior;
            
            // gets the display control
            let dtpGroup = submitInput.nextElementSibling;
            let dtpInput = dtpGroup.firstElementChild;
            let dtFormat = dtpInput.dataset.dateFormat;

            // set the input values
            if(includeTime) {
                submitInput.value = dateValue.toISOString();
            } else {
                submitInput.value = dateValue.toISOString().split("T")[0] + "T00:00:00.0000000";
            }
             
            dtpInput.value = dateValue.toLocaleDateString();
        }
    },

    setString(attr, value, findInEl) {
        ALYAForm.html.getElement(attr, "input", "text", findInEl).value = value;
        /*
            let surname = ALYAForm.getControl('york_formersurname');
            if(surname) surname.setValue("{{user.lastname}}");
        */
    },

    setPhoneString(attr, value, findInEl) {
        if(!value) return;
        var onlyDigits = ('' + value).replace(/\D/g, '');
        
        var match10 = onlyDigits.match(/^(\d{3})(\d{3})(\d{4})$/);
        if(match10) {
            this.setString(attr, "(" + match10[1] + ") " + match10[2] + "-" + match10[3], findInEl);
            return;
        }
        
        // no match default
        this.setString(attr, onlyDigits, findInEl);
    }, 

    setCheckbox(attr, value, findInEl) {
        if(typeof(value) !== 'boolean') throw new Error("The data is not a boolean type");
        ALYAForm.html.getElement(attr, "input", "checkbox", findInEl).checked = value;
    },

    setOptionset(attr, value, findInEl) {
        let getByLabel = isNaN(value) ? true : false;
        let ddl = ALYAForm.html.getElement(attr, "select", null, findInEl);
        if(!ddl) return;
        
        if(getByLabel) {
            for(const opt of ddl.options) {
                if(opt.text.toLowerCase() == value.toLowerCase()){
                    ddl.value = opt.value;
                }
            }
        } else {
            ddl.value = value;
        }
        
    },
    
    setLookup(attr, entity, id, primaryFieldVal, findInEl) {
        let removeValue = false;
        // check if null to remove the value
        if(!entity && !id && !primaryFieldVal) {
            entity = "";
            id = "";
            primaryFieldVal = "";
            removeValue = true;
        } else {
            if(!ALYAForm.val.isGuid(id)) throw new Error(`The id value is not a valid GUID: ${id}`);
            if(!primaryFieldVal) throw new Error(`The primary field value must be supplied.`);
            if(!entity) throw new Error(`The entity name value must be supplied.`);
        }

        let inputId = ALYAForm.html.getElement(attr, "input", "hidden", findInEl);
        let inputName = ALYAForm.html.getElement(`${attr}_name`, "input", "text", findInEl);
        let inputEntity = ALYAForm.html.getElement(`${attr}_entityname`, "input", "hidden", findInEl);
    
        if(!inputId || !inputName || !inputEntity) throw new Error("The Lookup controls could not be located on the form.");
        
        inputId.value = id;
        inputName.value = primaryFieldVal;
        inputEntity.value = entity;

        if(removeValue && inputId.parentElement) {
            let delBtn = inputId.parentElement.querySelector('div.input-group-btn button.clearlookupfield');
            if(delBtn) delBtn.parentNode.removeChild(delBtn);
        }
    },


    setRequired(attr) {
        try {
            if(typeof(Page_Validators) == 'undefined') return;
            let ctl = this.map.getControl(attr);
            if(!ctl) return;
            if(ctl.type === 'subgrid') return;

            let validator = document.createElement('span');
            validator.style.display = "none";
            validator.id = `RequiredFieldValidator${ctl.name}`;
            validator.controltovalidate = ctl.name;
            validator.errormessage = `<a href='#${ctl.name}_label'><b>${ctl.elLabel.innerText}</b> is required.</a>`;
            validator.evaluationfunction = function() { 
                // handle different control types
                if (!ctl.el.value || ctl.el.value == "") {
                    return false;
                } else {
                    return true;
                }          
            };

            Page_Validators.push(validator);
            
            // display required field on the control
            ctl.elInfoDiv.classList.add("required");
            let v = ctl.elInfoDiv.querySelector(".validators");
            if(v) v.appendChild(validator);
            ctl.el.setAttribute('aria-required', "true");
        } catch (e) {
            console.log("Portal Error setting field required: ", e, attr);
        } 
    },

    setNotRequired(attr) {
        if(typeof(Page_Validators) == 'undefined') return;
        let ctl = this.map.getControl(attr);
        if(!ctl) return;
        if(ctl.type === 'subgrid') return;

        if(ctl.el.value == 'undefined') return;
        let ctlId = `RequiredFieldValidator${ctl.name}`;
            
        // remove page validator
        for (i = 0; i < Page_Validators.length; i++) {
            if (Page_Validators[i].id === ctlId) {
                Page_Validators.splice(i);
            }
        }
            
        // remove control validator
        if(ctl.el.Validators != null) {
            for (i = 0; i < ctl.el.Validators.length; i++) {
                if (ctl.el.Validators[i].id === ctlId) {
                    ctl.el.Validators.splice(i);
                }
            }
        }

        // remove required field on the control
        ctl.elInfoDiv.classList.remove("required");
        let pageValidator = document.getElementById(ctlId);
        if(pageValidator) pageValidator.remove();

        ctl.el.removeAttribute('aria-required');
        ctl.el.removeAttribute('aria-label');
    },

    clearAllRequired(){
        let ctls = ALYAForm.map.getAllControls();
        
        for(const ctl of ctls) {
            ALYAForm.setNotRequired(ctl.name);
        }
    },

    setTooltip(attr, tooltip) {
        let ctl = document.getElementById(attr);
        if(ctl == null) return;
        ctl.title = tooltip;
    },

    addButton(title, value, addToFront, onclickFn) {
        let btnSibling = ALYAForm.map.getLastButton();
        if(addToFront) btnSibling = ALYAForm.map.getFirstButton();

        if(!btnSibling) return;
        
        let newButton = document.createElement("input");
        newButton.type = "button";
        newButton.title = title;
        newButton.value = value;
        newButton.classList = btnSibling.el.classList;
        
        if(addToFront) {
            btnSibling.el.parentNode.insertBefore(newButton, btnSibling.el);
        } else {
            btnSibling.el.parentNode.insertBefore(newButton, btnSibling.el.nextSibling);
        }

        newButton.addEventListener('click', () => {
            onclickFn();
        });
       
        // add button to data model
        ALYAForm.map.data.buttons.push({
            el: newButton,
            id: title,
            title: title,
            isSubmit: false
        });
    },

    hideButton(title, includeSubmit) {
        if(!includeSubmit) includeSubmit = false;
        if(!ALYAForm.map.data) ALYAForm.map.get();

        for(const btn of ALYAForm.map.data.buttons) {
            if(btn.title.toLowerCase() === title.toLowerCase() && btn.isSubmit == includeSubmit) {
                if(!btn.el.classList.contains("hidden"))
                    btn.el.classList.add("hidden");
                return;
            }
        }
    },

    showButton(title, includeSubmit) {
        if(!includeSubmit) includeSubmit = false;
        if(!ALYAForm.map.data) ALYAForm.map.get();

        for(const btn of ALYAForm.map.data.buttons) {
            if(btn.title.toLowerCase() === title.toLowerCase() && btn.isSubmit == includeSubmit) {
                if(btn.el.classList.contains("hidden"))
                    btn.el.classList.remove("hidden");
                return;
            }
        }
    },

    sectionVisible(sectionName, visible, findInEl) {
        try {
            let section = ALYAForm.html.getSection(sectionName, findInEl);
            if(section == null) throw new Error(`The section with name (${sectionName}) does not exist.`);

            if(visible) {
                section.style = "display:block;";
            } else {
                section.style = "display:none;";
            }
        } catch (e) {
            console.log("Portal Error: ", e);
        }
    },

    makeSectionCollapsable(sectionName) {
        try {
            let section = ALYAForm.html.getSection(sectionName);
            section.dataset.show = true;

            let title = section.getElementsByClassName('section-title')[0];
            title.style = "cursor: pointer;";

            let content = section.getElementsByClassName('section')[0];

            // show hide function
            const fn = () => {
                let section = ALYAForm.html.getSection(sectionName);
                let visible = section.dataset.show == "true" ? true : false;
                let content = section.getElementsByClassName('section')[0];

                if(visible == null) {
                    section.dataset.show = true;
                    visible = true;
                }

                if(visible) {
                    content.style = "display: none;";
                    section.dataset.show = false;
                    section.style = "margin: 0;";
                } else {
                    content.style = "display: block;";
                    section.dataset.show = true;
                    section.style = "";
                }
            };

            title.removeEventListener('click', fn);
            title.addEventListener('click', fn);

        } catch (e) {
            console.log("Portal Error: ", e);
        }        
    },

    async convertLookupToSelectAsync(lookupName, dataFn) {
            /*
                the dataFn is designed to have the following JSON structure:
                {
                    data: [
                        entity: {
                            id: "the record id guid",
                            name: "the primary field value",
                            entityname: "the entity name"
                        }
                    ]
                }
            */
        try {
            // get the lookup
            if(!dataFn) throw new Error(`The data function for the lookup is invalid.`);
            if(typeof(dataFn) !== "function") throw new Error(`The data function for the lookup is invalid.`);
            let lookup = ALYAForm.getControl(lookupName);
            if(!lookup) throw new Error(`The lookup specified ${lookupName} is invalid.`);

            let lookupVal = lookup.getValue();
            let curLkupRecId = lookupVal && lookupVal.id ? lookupVal.id : null;
            let curLkupRecName = lookupVal && lookupVal.name ? lookupVal.name : null;
            let curLkupEntity = lookupVal && lookupVal.entityname ? lookupVal.entityname : null;
            let dataHasCurrentRec = false;
            
            let query = await dataFn();
            console.log("convertLookupToSelectAsync() Data results: ", query);

            if(!query || !query.data || !query.data instanceof Array) return null;

            // get the lookup element parent
            if(!lookup.elInfoDiv || !lookup.elInfoDiv.parentElement) return null;
            let container = lookup.elInfoDiv.parentElement.querySelector('.control');
            
            // build the select
            let select = document.getElementById(`${lookupName}_ddl_lookup`);
            if(!select) select = document.createElement('select');
            select.innerHTML = null;
            select.className = "form-control picklist";
            select.id = `${lookupName}_ddl_lookup`;

            // add the first option
            let emptyOpt = document.createElement('option');
            emptyOpt.setAttribute('label', " ");
            select.options.add(emptyOpt);

            // add the query options
            for (let i = 0; i < query.data.length; i++) {
                if(!query.data[i].entity) continue;
                let ent = query.data[i].entity;
                      
                let opt = document.createElement('option');
                opt.value = ent.id
                opt.innerHTML = ent.name;
                opt.dataset.entity = ent.entityname;

                // set the currently selected value if present on the lookup
                if(curLkupRecId.toLowerCase() === ent.id.toLowerCase()) {
                    opt.setAttribute('selected', "selected");
                    dataHasCurrentRec = true;
                }

                select.options.add(opt);
            }

            // deal with record association that is not in the current data by adding it
            if(!dataHasCurrentRec && lookupVal && curLkupRecId && curLkupRecName && curLkupEntity) {
                let opt = document.createElement('option');
                opt.value = curLkupRecId
                opt.innerHTML = curLkupRecName;
                opt.dataset.entity = curLkupEntity;
                opt.setAttribute('selected', "selected");
                select.options.add(opt);
            }
 
            // hide the current control elements
            for(let i = 0; i < container.children.length; i++) {
                if(container.children[i].style) {
                    container.children[i].style = "display: none;";
                }
            }
            
            // replace the lookup element with the select
            container.appendChild(select);

            // add event handlers to move values from the select to the lookup 
            select.addEventListener('change', (evt) => {
                if(evt.target.tagName.toLowerCase() !== "select") return null;
                let selOpt = evt.target.options[evt.target.selectedIndex];
                if(selOpt) {
                    ALYAForm.setLookup(lookupName, selOpt.dataset.entity, selOpt.value, selOpt.text, null);                   
                } else {
                    ALYAForm.setLookup(lookupName, null, null, null, null);
                }
            });
        } catch(e) {
            console.log("Portal Error: ", e);
        }        
    },

    async convertLookupToTableAsync(lookupName, maxHeight, colsArr, dataFn) {
        /*
            the dataFn is designed to have the following JSON structure:
            {
                data: [
                    entity: {
                        id: "the record id guid",
                        name: "the primary field value",
                        entityname: "the entity name",
                        fields: [ {
                                name: <logical name>,
                                value: <value string>
                            } ...
                        ]
                    } ...
                ]
            }
        */
        try {
            // if the columns are not specified, use the entity references instead
            let colsSpecified = colsArr && colsArr.length > 0 && colsArr instanceof Array ? true : false;
            if(!maxHeight) maxHeight = 300;

            // get the lookup
            if(!dataFn) throw new Error(`The data function for the lookup is invalid.`);
            if(typeof(dataFn) !== "function") throw new Error(`The data function for the lookup is invalid.`);
            let lookup = ALYAForm.getControl(lookupName);
            if(!lookup) throw new Error(`The lookup specified ${lookupName} is invalid.`);

            let lookupVal = lookup.getValue();
            let curLookupId = lookupVal && lookupVal.id ? lookupVal.id : null;
            
            let query = await dataFn();
            let hasRecords = false;

            if(query && query.data && query.data instanceof Array) hasRecords = true;

            // get the lookup element parent
            if(!lookup.elInfoDiv || !lookup.elInfoDiv.parentElement) return null;
            let container = lookup.elInfoDiv.parentElement.querySelector('.control');
            
            let tableContainer = document.getElementById(`${lookupName}_table_lookup`);
            if(!tableContainer) tableContainer = document.createElement('div');
            tableContainer.innerHTML = null;
            
            tableContainer.className = "entity-grid";
            tableContainer.id = `${lookupName}_table_lookup`;

            let table = document.createElement('table');
            table.className = "table table-striped table-fluid";
            table.style = "width: 100%;";

            // add the header
            let tableHead = document.createElement('thead');
            // tableHead.style = "display: block;";
            tableHead.style = "display: table; width:100%; table-layout: fixed;";

            if(colsSpecified) {
                
                // todo
            
            } else {
                tableHead.innerHTML = `<tr style="display: table; width:100%; table-layout: fixed;">
                                        <th style="width:50px;" class="sort-enabled"><a href="#" role="button" aria-label="Select">Select</a></th>
                                        <th class="sort-enabled"><a href="#" role="button" aria-label="Name">Name</a></th>
                                   </tr>`;
            }
            
            table.appendChild(tableHead)

            let tableBody = document.createElement('tbody');
            // add the rows
            if(hasRecords) {
                tableBody.style = `display: block; table-layout:fixed; max-height:${maxHeight}px; overflow-y:auto; overflow-x: hidden;`;
                for (let i = 0; i < query.data.length; i++) {
                    if(!query.data[i].entity) continue;
                    let ent = query.data[i].entity;
                        
                    let row = document.createElement('tr');
                    row.dataset.id = ent.id
                    row.dataset.name = ent.name
                    row.dataset.entity = ent.entityname
                    row.style = "display: table; width:100%; table-layout: fixed;";

                    // set the currently selected value if present on the lookup
                    let isSelected = curLookupId.toLowerCase() === ent.id.toLowerCase();

                    // create a checkbox to select the record
                    let selCheckbox = document.createElement('input');
                    selCheckbox.type = "checkbox";
                    selCheckbox.id = ent.id;
                    if(isSelected) {
                        selCheckbox.setAttribute('checked', "checked");
                    }

                    if(colsSpecified) {
                        
                        // todo

                    } else {
                        row.innerHTML = `<td style="width:50px;padding:8px;" data-th="Select">${selCheckbox.outerHTML}</td>
                            <td data-th="Name">${ent.name}</td>`;
                    }
                   
                    // add selected to top
                    if(isSelected) {
                        tableBody.prepend(row);
                    } else {
                        tableBody.appendChild(row);
                    }
                }
            } else {
                tableBody.style = `height: 50px;overflow-y:auto;overflow-x: hidden;width:100%`;
                tableBody.innerHTML = `<tr><td colspan="4"><div style="width:100%;">There are no records to display.</div></td></tr>`;           
            }

            table.appendChild(tableBody);
            
            // hide the current control elements
            for(let i = 0; i < container.children.length; i++) {
                if(container.children[i].style) {
                    container.children[i].style = "display: none;";
                }
            }
            
            // replace the lookup element with the select
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);

            // add the onchange event for the checkboxes
            let allChks = table.querySelectorAll('tbody tr td input[type="checkbox"]');
            for(const chk of allChks) {
                chk.addEventListener('change', (evt) => {
                    let chks = table.querySelectorAll('tbody tr td input[type="checkbox"]');
                    for(const c of chks) {
                        if(evt.target.id === c.id) {
                            if(evt.target.checked) {
                                // todo assign lookup
                                let chkParent = c.parentElement.parentElement;
                                ALYAForm.setLookup(lookupName, chkParent.dataset.entity, chkParent.dataset.id, chkParent.dataset.name, null);
                            } else {
                                ALYAForm.setLookup(lookupName, null, null, null, null);
                            }
                        } else {
                            c.checked = false;
                        }
                    }
                });
            }
        } catch(e) {
            console.log("Portal Error: ", e);
        }        
    },

    resizeIframeHeight(name, height) {
        try {       
            if(isNaN(height)) height = 150;
            if(height < 50) height = 50;

            let iframe = document.getElementById(name);
            if(iframe == null) return;
            
            let idoc = iframe.contentDocument || iframe.contentWindow.document;
            
            if(!iframe.tagName) return;
            if(iframe.tagName.toLowerCase() === "iframe") {
                iframe.height = `${height}px`;
            }

        } catch (e) {console.log("Portal Error: ", e);}
    },
    
    multiselect: {
        // transform a ddl to multiple checkboxes
        toCheckboxes(optionSetFieldName, stringFieldName, maxHeight){
            let ddl = ALYAForm.html.getElement(optionSetFieldName, "select", null, null);
            if(!ddl) return;
            
            let strInput = ALYAForm.html.getElement(stringFieldName, "input", "text", null);
            if(!strInput) return;

            // create a new div container to hold the options
            let container = document.createElement("div");
            container.id = `ms_${optionSetFieldName}`;
            container.className = "alya_multiselect_checkboxes";
            
            if(maxHeight != null && !isNaN(maxHeight)) {
                container.style = `max-height: ${maxHeight}px; overflow-y: auto;`;
            }

            for(const opt of ddl.options) {
                let optText = opt.innerHTML;
                if(optText.trim() == "") { 
                    ddl.remove(opt);
                    continue;
                }

                let optDiv = document.createElement("div");
                optDiv.className = "alya_multiselect_checkbox";
                    
                let lbl = document.createElement("label");
                lbl.id = `ms_${optionSetFieldName}_${opt.value}_label`
                lbl.setAttribute('for', `ms_${optionSetFieldName}_${opt.value}`);
                lbl.innerHTML = optText;

                let option = document.createElement("input");
                option.type = "checkbox"
                option.checked = opt.selected;
                option.id = `ms_${optionSetFieldName}_${opt.value}`;
                option.dataset.optionValue = opt.value;
                option.dataset.optionsetName = optionSetFieldName;

                optDiv.appendChild(option);
                optDiv.appendChild(lbl);
                container.appendChild(optDiv);

                option.addEventListener('change', () => {
                    ALYAForm.multiselect.fromCheckboxesToString(optionSetFieldName, stringFieldName);
                });
            }

            ddl.style = "display: none;";
            ddl.parentElement.appendChild(container);

            this.fromStringToCheckboxes(optionSetFieldName, stringFieldName);
            
        },
        // transform a ddl to multiselect ddl
        transform(optionSetFieldName, stringFieldName){
            let ddl = ALYAForm.html.getElement(optionSetFieldName, "select", null, null);
            if(!ddl) return;
            
            let strInput = ALYAForm.html.getElement(stringFieldName, "input", "text", null);
            if(!strInput) return;

            // set the drop down list to a multi select
            ddl.setAttribute("multiple", "");

            for(const opt of ddl.options) {
                let optText = opt.innerHTML;
                if(optText.trim() == "") { 
                    ddl.remove(opt);
                    continue;
                }
            }

            ddl.addEventListener('change', () => {
                ALYAForm.multiselect.fromOptionsetToString(optionSetFieldName, stringFieldName);
            });

            strInput.addEventListener('change', () => {
                ALYAForm.multiselect.fromStringToOptionset(optionSetFieldName, stringFieldName);
            });

            this.fromStringToOptionset(optionSetFieldName, stringFieldName);
        },

        // maps selected values on ddl to string value
        fromOptionsetToString(optionSetFieldName, stringFieldName){
            let ddl = ALYAForm.html.getElement(optionSetFieldName, "select", null, null);
            if(!ddl) return;

            let strInput = ALYAForm.html.getElement(stringFieldName, "input", "text", null);
            if(!strInput) return;
            
            let strValue = "";
            for(const opt of ddl.options) {
                if(opt.selected) strValue += `${opt.value.toString()},`;
            }

            if(strValue.length > 0)
                strValue = strValue.substring(0, strValue.length - 1);

            strInput.value = strValue;
            strInput.classList.add("dirty");
        },

        // maps string values to ddl selections
        fromStringToOptionset(optionSetFieldName, stringFieldName){
            let ddl = ALYAForm.html.getElement(optionSetFieldName, "select", null, null);
            if(!ddl) return;

            let strInput = ALYAForm.html.getElement(stringFieldName, "input", "text", null);
            if(!strInput) return;

            let vals = strInput.value.split(",");
            
            for(const val of vals) {
                for(const opt of ddl.options) {
                    if(opt.value == val) {
                        opt.selected = true;
                    }
                }
            }
        },
        // maps selected values in a checkbox list to string value
        fromCheckboxesToString(optionSetFieldName, stringFieldName){
            let chks = document.querySelectorAll(`[data-optionset-name="${optionSetFieldName}"]`);
            if(!chks) return;

            let strInput = ALYAForm.html.getElement(stringFieldName, "input", "text", null);
            if(!strInput) return;

            let strValue = "";
            for(const chk of chks) {
                if(chk.checked) strValue += `${chk.dataset.optionValue.toString()},`;
            }

            if(strValue.length > 0)
                strValue = strValue.substring(0, strValue.length - 1);

            strInput.value = strValue;
            strInput.classList.add("dirty");
        },
        // maps selected values in a checkbox list from a string value
        fromStringToCheckboxes(optionSetFieldName, stringFieldName){
            let chks = document.querySelectorAll(`[data-optionset-name="${optionSetFieldName}"]`);
            if(!chks) return;

            let strInput = ALYAForm.html.getElement(stringFieldName, "input", "text", null);
            if(!strInput) return;

            let vals = strInput.value.split(",");
            
            for(const val of vals) {
                for(const chk of chks) {
                    if(chk.dataset.optionValue == val) {
                        chk.checked = true;
                    }
                }
            }
        },
    },

    map: {
        data: null,
        
        get() {
            try {
                this.getForm();
                this.getFormButtons();
                this.getFormTabs();
                this.getFormSections();
                this.getFormFields();     

console.log(this.data);           
console.log(this.toJson());

            } catch(e) { console.log("Portal Error: ", e.message); }
        },

        getForm() {
            // get the form elements
            let forms = document.getElementsByClassName('entity-form');
            if(forms.length === 0) return;
            let form = forms[0];
            let formContainer = document.getElementById(form.id.replace("_EntityFormView", ""));

            // get the entity information from hidden inputs
            let entity = document.getElementById(`${form.id}_EntityName`);
            let entityId = document.getElementById(`${form.id}_EntityID`);
            let entityState = document.getElementById(`${form.id}_EntityState`);
            let entityStatus = document.getElementById(`${form.id}_EntityStatus`);
            let entityConfig = document.getElementById(`${form.id}_EntityLayoutConfig`);

            this.data = {
                id: form.id,
                formEl: formContainer,
                entity: {
                    name: entity ? entity.value : null,
                    id: entityId ? entityId.value : null,
                    state: entityState ? entityState.value : null,
                    status: entityStatus ? entityStatus.value : null
                }
            }
        },

        getFormButtons() {
            this.data.buttons = new Array();
            
            let formEl = this.data.formEl;
            if(!formEl) return;

            let buttonsEl = formEl.querySelector('.form-custom-actions');
            if(!buttonsEl) formEl.querySelector('.actions');
            if(!buttonsEl) return;

            let inputQry = buttonsEl.querySelectorAll("input[type=button]");
            let buttonQry = buttonsEl.querySelectorAll("button");

            for(const i of inputQry) {
                let obj = {
                    el: i,
                    title: i.title,
                    id: i.id
                };
                if(i.classList.contains("submit-btn")) {
                    obj.isSubmit = true;
                } else {
                    obj.isSubmit = false;
                }
                this.data.buttons.push(obj);
            }

            for(const b of buttonQry) {              
                let btn = {
                    el: b,
                    title: b.innerText,
                    id: b.innerText,
                    isSubmit: false
                };
                
                if(b.parentElement.classList.contains("modal-title") || b.parentElement.classList.contains("modal-dialog") || b.parentElement.classList.contains("modal-footer") || b.parentElement.classList.contains("modal-body") || b.parentElement.classList.contains("modal-header")) {
                    continue;
                }

                this.data.buttons.push(btn);
            }
            
        },

        getFormTabs() {
            if(!this.data) return;

            let tabArr = new Array();
            let form = this.data.formEl;
            
            let tabs = form.getElementsByClassName('tab');
            if(!tabs || tabs.length === 0) this.data.tabs = tabArr;

            for(let i = 0; i < tabs.length; i++) {
                let tab = tabs[i];
                let tabTitleEl = tab.previousElementSibling;
                let tabTitleValid = true;
                if(tabTitleEl.className != "tab-title") tabTitleValid = false;
                
                tabArr.push({
                    active: i === 0 ? true : false,
                    visible: true,
                    name: tab.dataset.name,
                    display: tabTitleValid ? tabTitleEl.innerHTML : "",
                    displayEl: tabTitleValid ? tabTitleEl : null,
                    el: tab
                });
            }

            this.data.tabs = tabArr;
        },

        getFormSections() {
            if(!this.data) return;
                        
            for(const tab of this.data.tabs) {
                tab.sections = new Array();
                
                let sections = tab.el.getElementsByTagName('fieldset');
                for(let i = 0; i < sections.length; i++) {
                    let section = sections[i];
                    let title = section.querySelector('.section-title');
                    if(title == null) continue;

                    let content = section.querySelector('.section');
                    if(content == null) continue;

                    tab.sections.push({
                        visible: true,
                        name: content.dataset.name,
                        display: title.innerHTML,
                        el: section
                    });
                }
            }
        },

        getFormFields() {
            if(!this.data) return;
            
            // todo for debugging
            this.data.controls = new Array();
        
            for(const tab of this.data.tabs) {
                for(const section of tab.sections) {
                    let controlArr = section.el.getElementsByClassName('control');
                    section.controls = new Array();
                    for(const ctl of controlArr) {
                        let control = this.evalControl(ctl);
                        if(control) { 
                            section.controls.push(control);
                            
                            // todo for debugging
                            this.data.controls.push({
                                name: control.name,
                                display: control.elLabel ? control.elLabel.innerText : control.name,
                                value: control.value            
                            });
                        }
                    }
                }
            }
        },
        
        evalControl(controlDiv) {
            if(!controlDiv) return null;
            if(!controlDiv.tagName || controlDiv.tagName.toLowerCase() !== 'div') return null;
            
            let control = null;
            control = this.evalLookup(controlDiv);
            if(!control) control = this.evalOptionSet(controlDiv);
            if(!control) control = this.evalBool(controlDiv);
            if(!control) control = this.evalDateTime(controlDiv);
            if(!control) control = this.evalSubgrid(controlDiv);
            if(!control) control = this.evalString(controlDiv);            
            return control;
        },
        
        evalLookup(el){
            // lookup: div > div.input-group > input[text]
            let firstEl = el.firstElementChild;
            if(!firstEl) return null;
            
            if(firstEl.tagName.toLowerCase() == "div" && firstEl.classList.contains("input-group")) {
                
                // get the three inputs for the entity reference, make sure the control is a lookup
                let inputs = firstEl.querySelectorAll("input");
                if(!inputs || inputs.length === 0 || !inputs[0].classList.contains('lookup')) { 
                    return null;
                } 

                let elInfoDiv = firstEl.parentElement.previousElementSibling;
                let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;

                let getValue = function() {
                    
                    let entRef = { 
                        id: null,
                        name: "",
                        entityname: ""
                    };

                    for(const input of inputs) {
                        let id = input.id;
                        let value = input.value;
    
                        if(id.endsWith("_name")) {
                            entRef.name = value;
                            entRef.elName = input;
                            continue;
                        }
    
                        if(id.endsWith("_entityname")) {
                            entRef.entityname = value;
                            entRef.elEntity = input;
                            continue;
                        }
    
                        entRef.id = value;
                        entRef.elId = input;
                    }
                    
                    if(entRef.id == null || entRef.id == "") return null;
                    return entRef;
                };
    
                let setValue = function (value) {
                    if(!value) value = null;
                    if(!typeof(value) == 'object') return;
                    if(!value.hasOwnProperty('entityname') || !value.hasOwnProperty('id') || !value.hasOwnProperty('name')) return;

                    let setDirtyId = null;
                    for(const input of inputs) {
                        let id = input.id;
    
                        if(id.endsWith("_name")) {
                            input.value = value.name;
                            continue;
                        }
    
                        if(id.endsWith("_entityname")) {
                            input.value = value.entityname;
                            continue;
                        }
    
                        entRef.id = value.id;
                        setDirtyId = input.id;
                    }

                    setIsDirty(setDirtyId);
                };
    
                let obj = {
                    name: null,
                    type: "lookup",
                    val: null,
                    el: null,
                    elInfoDiv: elInfoDiv,
                    elLabel: elLabel,
                    getValue: getValue,
                    setValue: setValue
                };

                // set the obj props
                for(const input of inputs) {
                    let id = input.id;

                    if(id.endsWith("_name")) continue;
                    if(id.endsWith("_entityname")) continue;

                    obj.name = id;
                    obj.el = input;
                }
       
                obj.value = obj.getValue();
                return obj;
            }
            return null;
        },

        // creates an option set field
        evalOptionSet(el){
            // optionset: div > select (has class picklist)
            let firstEl = el.firstElementChild;
            if(!firstEl || firstEl.tagName.toLowerCase() !== 'select' || !firstEl.classList.contains('picklist')) return null;
            
            let elInfoDiv = el.previousElementSibling;
            let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;

            let getValue = function() {
                if(!firstEl.options[firstEl.selectedIndex].value) return null;

                let value = { 
                    value: parseInt(firstEl.options[firstEl.selectedIndex].value),
                    display: firstEl.options[firstEl.selectedIndex].text
                };

                return value;
            };

            let setValue = function (value) {
                if(!value) value = null;

                if(typeof(value) == 'object') {
                    if(!value.hasOwnProperty('value') || !value.hasOwnProperty('display')) return;

                    // set the ddl to the kvp value
                    ALYAForm.html.setSelectValue(firstEl, value.value);
                } else {
                    ALYAForm.html.setSelectValue(firstEl, value);
                }

                setIsDirty(firstEl.id);
            };

            let obj = {
                name: firstEl.id,
                val: {},
                el: firstEl,
                elInfoDiv: elInfoDiv,
                elLabel: elLabel,
                type: "picklist",
                options: new Array(),
                getValue: getValue,
                setValue: setValue
            };

            for(const opt of firstEl.options) {
                obj.options.push({
                    value: opt.value,
                    display: opt.text
                });
            }

            obj.value = obj.getValue();
            return obj;
        },

        // create boolean field
        evalBool(el){
            let firstEl = el.firstElementChild;
            if(!firstEl) return null;
            
            // check for checkboxes
            // checkbox: div > span.checkbox > input[checkbox]
            if(firstEl.tagName.toLowerCase() == "span" && firstEl.classList.contains('checkbox')) {
                if(firstEl.firstElementChild.tagName.toLowerCase() == "input" && firstEl.firstElementChild.type === "checkbox") {
                    
                    let elInfoDiv = el.previousElementSibling;
                    let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;

                    let getValue = function() {
                        return firstEl.firstElementChild.checked;
                    };
    
                    let setValue = function (value) {
                        if(!value) value = false;

                        if(typeof(value) == 'string')
                            firstEl.firstElementChild.checked = value == "true";

                        if(typeof(value) == 'boolean')
                            firstEl.firstElementChild.checked = value;

                        if(typeof(value) === 'number')
                            firstEl.firstElementChild.checked = value > 0;

                        setIsDirty(firstEl.firstElementChild.id);
                    };

                    let obj = {
                        name: firstEl.firstElementChild.id,
                        el: firstEl.firstElementChild,
                        elInfoDiv: elInfoDiv,
                        elLabel: elLabel,
                        type: "boolean",
                        getValue: getValue,
                        setValue: setValue
                    };

                    obj.value = obj.getValue();
                    return obj;
                }
            }

            // check for 2-option list
            // optionset boolean: div > select (has class boolean-dropdown)
            if(firstEl.tagName.toLowerCase() == "select" && firstEl.classList.contains('boolean-dropdown')) {
                let elInfoDiv = el.previousElementSibling;
                let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;

                if(!firstEl.options || firstEl.options.length == 0) return null;

                let getValue = function() {
                    // gets the selected option
                    let selOpt = firstEl.options[firstEl.selectedIndex].value
                    return selOpt === 0 || selOpt === "0" ? true : false;
                };

                let setValue = function (value) {
                    if(!value) value = false;

                    for(const opt in firstEl.options) {
                        if(opt.value !== 0 && opt.value !== '0') continue;
                        
                        if(typeof(value) == 'string')
                        firstEl.firstElementChild.checked = value == "true";

                        if(typeof(value) == 'boolean')
                            firstEl.firstElementChild.checked = value;

                        if(typeof(value) === 'number')
                            firstEl.firstElementChild.checked = value > 0;

                        setIsDirty(firstEl.firstElementChild.id);

                        break;
                    }
                };

                let selObj = {
                    name: firstEl.id,
                    el: firstEl,
                    elInfoDiv: elInfoDiv,
                    elLabel: elLabel,
                    type: "boolean",
                    getValue: getValue,
                    setValue: setValue
                };
              
                selObj.value = selObj.getValue();
                return selObj;
            }

            // check for radio options
            // checkbox: div > span.boolean-radio > input[radio]
            if(firstEl.tagName.toLowerCase() == "span" && firstEl.classList.contains('boolean-radio')) {
                if(firstEl.firstElementChild.tagName.toLowerCase() == "input" && firstEl.firstElementChild.type === "radio") {
                    let elInfoDiv = el.previousElementSibling;
                    let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;

                    let elRadioTrue = firstEl.querySelector(`#${firstEl.id}_1`);
                    let elRadioFalse = firstEl.querySelector(`#${firstEl.id}_0`);
                    if(!elRadioTrue || !elRadioFalse) return null;
                    
                    let getValue = function() {
                        return elRadioTrue.checked;
                    };
    
                    let setValue = function (value) {
                        if(!value) value = false;
                        
                        // set defaults
                        elRadioTrue.checked = false;
                        elRadioFalse.checked = true;

                        if(typeof(value) == 'string' && value == "true") {
                            elRadioTrue.checked = true;
                            elRadioFalse.checked = false;
                        } 

                        if(typeof(value) == 'boolean' && value === true) {
                            elRadioTrue.checked = true;
                            elRadioFalse.checked = false;
                        } 

                        if(typeof(value) === 'number' && value > 0) {
                            elRadioTrue.checked = true;
                            elRadioFalse.checked = false;
                        }

                        setIsDirty(firstEl.id);
                    };

                    let obj = {
                        name: firstEl.id,
                        el: firstEl,
                        elInfoDiv: elInfoDiv,
                        elLabel: elLabel,
                        type: "boolean",
                        getValue: getValue,
                        setValue: setValue
                    };

                    obj.value = obj.getValue();
                    return obj;
                }
            }

            return null;
        },

        // create datetime field
        evalDateTime(el){
            // datetime: div > input[text] (has class datetime)(has dataset.dateFormat)
            //      dataset.type = date
            //      dataset.type = datetime
            let dateInput = el.querySelector('[data-type="date"]'); // 2022-10-30T00:00:00.0000000
            let dateTimeInput = el.querySelector('[data-type="datetime"]'); // 2023-01-24T15:00:00.0000000Z        
            if(!dateInput && !dateTimeInput) return null;

            let ctlName = dateInput != null ? dateInput.id : dateTimeInput.id;

            // get label info
            let elInfoDiv = el.previousElementSibling;
            let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;
            let pickerInput = el.querySelector(".datetimepicker");
            if(!pickerInput) return null;
            
            if(dateInput) {
                let getValue = function() {
                    return dateInput.value != "" ? dateInput.value : null;
                };
                
                let setValue = function (value) {
                    ALYAForm.setDate(ctlName, value);                 
                    setIsDirty(ctlName);
                };
                
                let obj = {
                    name: dateInput.id,
                    value: dateInput.value,
                    el: dateInput,
                    elInfoDiv: elInfoDiv,
                    elLabel: elLabel,
                    elPicker: pickerInput,
                    type: "date",
                    getValue: getValue,
                    setValue: setValue
                };
                
                obj.value = obj.getValue();
                return obj;
            }

            if(dateTimeInput) {
                let getValue = function() {
                    return dateTimeInput.value != "" ? dateTimeInput.value : null;
                };
                
                let setValue = function (value) {
                    ALYAForm.setDate(ctlName, value);
                    setIsDirty(ctlName);
                };
                
                let obj = {
                    name: dateTimeInput.id,
                    value: dateTimeInput.value,
                    el: dateTimeInput,
                    elInfoDiv: elInfoDiv,
                    elLabel: elLabel,
                    elPicker: pickerInput,
                    type: "datetime",
                    getValue: getValue,
                    setValue: setValue
                };
                
                obj.value = obj.getValue();
                return obj;
            }

            return null;
        },

        // creates a string field
        evalString(el){
            let firstEl = el.firstElementChild;
            if(!firstEl) return null;

            // text: div > textarea (has class textarea)
            if(firstEl.tagName.toLowerCase() == "textarea" && firstEl.classList.contains('textarea')) {
                let elInfoDiv = el.previousElementSibling;
                let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;
                
                let getValue = function() {
                    return firstEl.value;
                };

                let setValue = function (value) {
                    if(!value) value = "";
                    firstEl.value = value;
                    setIsDirty(firstEl.id);
                };

                let textObj = {
                    name: firstEl.id,
                    el: firstEl,
                    elInfoDiv: elInfoDiv,
                    elLabel: elLabel,
                    type: "memo",
                    getValue: getValue,
                    setValue: setValue
                };

                textObj.value = textObj.getValue();
                return textObj;
            }

            // money: div > div > input[text] (has class money)
            if(firstEl.tagName.toLowerCase() == "div") {

                let moneyInput = firstEl.querySelector('.money');
                if(!moneyInput) return null;

                let elInfoDiv = el.previousElementSibling;
                let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;

                let getValue = function() {
                    let moneyValue = parseFloat(moneyInput.value);
                    if(isNaN(moneyValue)) moneyValue = 0;

                    return moneyValue;
                };

                let setValue = function(value) {
                    if(!value) value = "";

                    let moneyValue = 0;
                    moneyValue = parseFloat(value);
                    if(isNaN(moneyValue)) moneyValue = 0;

                    moneyInput.value = moneyValue;
                    setIsDirty(moneyInput.id);
                };

                let moneyObj = {
                    name: moneyInput.id,
                    el: moneyInput,
                    elInfoDiv: elInfoDiv,
                    elLabel: elLabel,
                    type: "money",
                    getValue: getValue,
                    setValue: setValue
                };

                moneyObj.value = moneyObj.getValue();
                return moneyObj;
            }

            // float: div > input[text] (has class double)
            // integer: div > input[text] (has class integer)
            // decimal: div > input[text] (has class decimal)   
            // text: div > input[text] (has class text)
            if(firstEl.tagName.toLowerCase() == "input" && firstEl.type === "text") {
                let elInfoDiv = el.previousElementSibling;
                let elLabel = elInfoDiv != null ? elInfoDiv.querySelector("label") : null;
                
                let getValue = function() {
                    return firstEl.value;
                };

                let setValue = function(value) {
                    if(!value) value = "";
                    firstEl.value = value;
                    setIsDirty(firstEl.id);
                };

                let strObj = {
                    name: firstEl.id,
                    el: firstEl,
                    elInfoDiv: elInfoDiv,
                    elLabel: elLabel
                }

                // todo determine the type of textbox input
                if(firstEl.classList.contains('double')) { 
                    strObj.type = "float";

                    getValue = function() {
                        let value = parseFloat(firstEl.value);
                        if(isNaN(value)) value = 0;
    
                        return value;
                    };

                    setValue = (value) => {
                        if(!value) value = "";

                        let floatValue = 0;
                        floatValue = parseFloat(value);
                        if(isNaN(floatValue)) floatValue = 0;

                        firstEl.firstElementChild.value = floatValue;
                        setIsDirty(firstEl.id);
                    };

                    strObj.getValue = getValue;
                    strObj.setValue = setValue;
                    strObj.value = strObj.getValue();
                    return strObj;
                }

                if(firstEl.classList.contains('integer')) {
                    strObj.type = "integer";
                   
                    getValue = function() {
                        let value = parseInt(firstEl.value);
                        if(isNaN(value)) value = 0;
    
                        return value;
                    };

                    setValue = function(value) {
                        if(!value) value = "";

                        let intValue = 0;
                        intValue = parseInt(value);
                        if(isNaN(intValue)) intValue = 0;

                        firstEl.firstElementChild.value = intValue;
                        setIsDirty(firstEl.id);
                    };
                    
                    strObj.getValue = getValue;
                    strObj.setValue = setValue;
                    strObj.value = strObj.getValue();
                    return strObj;
                }
                
                if(firstEl.classList.contains('decimal')) {
                    strObj.type = "decimal";
                   
                    getValue = function() {
                        let value = parseFloat(firstEl.value);
                        if(isNaN(value)) value = 0;
    
                        return value;
                    };

                    setValue = function(value) {
                        if(!value) value = "";

                        let floatValue = 0;
                        floatValue = parseFloat(value);
                        if(isNaN(floatValue)) floatValue = 0;

                        firstEl.firstElementChild.value = floatValue;
                        setIsDirty(firstEl.id);
                    };

                    // strObj.value = parseFloat(strObj.value);
                    strObj.getValue = getValue;
                    strObj.setValue = setValue;
                    strObj.value = strObj.getValue();
                    return strObj;
                }
                
                if(firstEl.classList.contains('text')) {
                    strObj.type = "string";
                    strObj.maxLength = firstEl.maxLength !== 'undefined' ? firstEl.maxLength : null;
                    strObj.getValue = getValue;
                    strObj.setValue = setValue;
                    strObj.value = strObj.getValue();
                    return strObj;
                }

                
            }

            return null;
        },

        evalState(el){
            // state: div > span.state > input[checkbox]
            let firstEl = el.firstElementChild;
            if(!firstEl) return null;

            return null;
        },
        
        evalStatus(el){
            // status: div > span.status > input[checkbox]
            let firstEl = el.firstElementChild;
            if(!firstEl) return null;

            return null;
        },

        evalSubgrid(el){
            // status: div > div.subgrid
            let grid = el.querySelector('div.subgrid');
            if(!grid) return null;

            let table = grid.querySelector('div.view-grid table');
            if(!table) return null;

            let refresh = function() {                
                this.columns = ALYAForm.html.getTableColumns(table);
                this.rows = ALYAForm.html.getTableRows(table);
            };

            let getValue = async function() {
                while(!this.columns || !this.rows) {
                    await new Promise(result => setTimeout(result, 1000));
                    this.refresh();
                }
                return this;
            };

            let setValue = function (value) {
                //setIsDirty(firstEl.id);
            };

            let obj = {
                name: grid.id,
                el: grid,
                elTable: table,
                columns: ALYAForm.html.getTableColumns(table),
                rows: ALYAForm.html.getTableRows(table),
                elLabel: null,
                type: "subgrid",
                getValue: getValue,
                setValue: setValue,
                refresh: refresh
            };

            return obj;
        },

        // record access to map data
        getTab(name) {
            if(!ALYAForm.map.data) ALYAForm.map.get();
            for(const tab of ALYAForm.map.data.tabs) {
                if(tab.name.toLowerCase() === name.toLowerCase() || tab.display.toLowerCase() === name.toLowerCase()) {
                    return tab;
                }
            }
            return null;
        }, 

        getActiveTab() {
            if(!ALYAForm.map.data) ALYAForm.map.get();
            for(const tab of ALYAForm.map.data.tabs) {
                if(tab.active) {
                    return tab;
                }
            }
            return null;
        }, 

        getSection(name) {
            if(!ALYAForm.map.data) ALYAForm.map.get();
            for(const tab of ALYAForm.map.data.tabs) {
                for(const sec of tab.sections) {
                    if(sec.name.toLowerCase() === name.toLowerCase() || sec.display.toLowerCase() === name.toLowerCase()) {
                       return sec;
                    }
                }
            }
            return null;
        },

        getControl(name) {
            if(!ALYAForm.map.data) ALYAForm.map.get();
            for(const tab of ALYAForm.map.data.tabs) {
                for(const sec of tab.sections) {
                    for(const ctl of sec.controls) {
                        if(ctl.type === 'subgrid') continue;
                        if(ctl.name.toLowerCase() === name.toLowerCase() || ctl.elLabel.innerText.toLowerCase() === name.toLowerCase()) {
                           return ctl;
                        }
                    }
                }
            }
            return null;
        },

        getButton(title, includeSubmit){
            if(!includeSubmit) includeSubmit = false;
            if(!ALYAForm.map.data) ALYAForm.map.get();

            for(const btn of ALYAForm.map.data.buttons) {
                if(btn.title.toLowerCase() === title.toLowerCase() && btn.isSubmit == includeSubmit) {
                    return btn;
                }
            }
        },

        getFirstButton(){
            if(!ALYAForm.map.data) ALYAForm.map.get();
            if(ALYAForm.map.data.buttons.length > 0) {
                return ALYAForm.map.data.buttons[0];
            }
            return null;
        },

        getLastButton(){
            if(!ALYAForm.map.data) ALYAForm.map.get();
            if(ALYAForm.map.data.buttons.length > 0) {
                return ALYAForm.map.data.buttons[ALYAForm.map.data.buttons.length - 1];
            }
            return null;
        },

        getAllControls() {
            if(!ALYAForm.map.data) ALYAForm.map.get();
            let ctlArr = new Array();
            for(const tab of ALYAForm.map.data.tabs) {
                if(!tab.sections) continue;
                for(const sec of tab.sections) {
                    if(!sec.controls) continue;
                    for(const ctl of sec.controls) {
                        ctlArr.push(ctl);
                    }
                }
            }
            return ctlArr;
        },

        controlNamesVisible(visible) {
            let controls = this.getAllControls();
            for(const ctl of controls){
                let name = ctl.name;
                if(!ctl.elLabel) continue;

                let lbl = ctl.elLabel.innerText.replace(` (${name})`, "");
                if(visible) {
                    ctl.elLabel.innerText = `${lbl} (${name})`;
                } else {
                    ctl.elLabel.innerText = lbl;
                }
            }
        },

        formJson() {
            let entity = {
                entity: ALYAForm.map.data.entity,
                fields: new Array()
            };
            let controls = this.getAllControls();
            for(const ctl of controls){
                if(!ctl) continue;
                let val = ctl.getValue();
                if(val != null && typeof(val)=="object") {
                    if(val.hasOwnProperty('elName')) delete val.elName;
                    if(val.hasOwnProperty('elId')) delete val.elId;
                    if(val.hasOwnProperty('elEntity')) delete val.elEntity;
                }
                entity.fields.push({
                    name: ctl.name,
                    type: ctl.type,
                    value: val
                });
            }
            return JSON.stringify(entity);
        },
        // returns a form data object without the element references
        toJson() {
            let form = {
                entity: ALYAForm.map.data.entity,
                tabs: new Array()
            };

            // get tabs
            for(const t of ALYAForm.map.data.tabs) {
                let tab = {
                    name: t.name,
                    display: t.display,
                    active: t.active,
                    visible: t.visible,
                    sections: new Array()
                };
                
                // get sections of tab
                for(const sec of t.sections) {
                    let section = {
                        name: sec.name,
                        display: sec.display,
                        visible: sec.visible,
                        controls: new Array()
                    };

                    // get controls in section
                    for(const ctl of sec.controls) {
                        let control = {
                            name: ctl.name,
                            label: ctl.elLabel ? ctl.elLabel.innerText : null,
                            type: ctl.type,
                            value: ctl.getValue()
                        };

                        if(ctl.value && ctl.type === "lookup") {
                            delete control.value.elName;
                            delete control.value.elId;
                            delete control.value.elEntity;
                        }

                        if(ctl.maxLength) control.maxLength = ctl.maxLength;
                        if(ctl.options) control.options = ctl.options;

                        section.controls.push(control);
                    }
                    tab.sections.push(section);
                }
                form.tabs.push(tab);
            }

            return JSON.stringify(form);
        }
    },
    tabs2btns:{
        hideTabTitles: false,
        overrideSectionVisibility: false,
        build(initialTab) {

            // get button container 
            let container = document.querySelector('.crm-form-sections2tabs');
            if(!container) {
                throw new Error("The webpage is missing a container element with class: crm-form-sections2tabs");
                return;
            }

            if(ALYAForm.map.data == null) ALYAForm.map.get();
            
            if(!initialTab) initialTab = ALYAForm.map.data.tabs[0].name;
            for(const tab of ALYAForm.map.data.tabs) {
                // create tab buttons and add to container
                this.addTab(container, tab);
                
                if(initialTab == tab.name || initialTab.toLowerCase() == tab.display.toLowerCase()) {
                    tab.active = true;
                } else {
                    tab.active = false;
                }
            }

            ALYAForm.tabs2btns.showHideTabs();
            ALYAForm.tabs2btns.showHideSections();
            ALYAForm.tabs2btns.onloadActiveTab();
        },
        addTab(container, tab) {
            // build the tab element
            let tabBtn = document.createElement('div');
            tabBtn.classList.add("tab");
            tabBtn.innerHTML = tab.display;
            tabBtn.dataset.tabname = tab.name;       
            container.appendChild(tabBtn);

            // add the button reference to the tab
            tab.tabButton = tabBtn;
            tabBtn.addEventListener('click', this.onclickTab);
        },
        setNextTabActive() {
            for(let i = 0; i < ALYAForm.map.data.tabs.length; i++) {
                let tab = ALYAForm.map.data.tabs[i];
                // not the last tab
                if(tab.active && i < ALYAForm.map.data.tabs.length - 1) {
                    tab.active = false;
                    ALYAForm.map.data.tabs[i + 1].active = true;
                    break;
                }
            }
            
            ALYAForm.tabs2btns.showHideTabs();
            ALYAForm.tabs2btns.showHideSections();
            ALYAForm.tabs2btns.onloadActiveTab();
        },
        addTabBanner(tabName, innerHtml) {
            if(ALYAForm.map.data == null) ALYAForm.map.get();
            let tab = ALYAForm.map.getTab(tabName);
            if(!tab) return;
            
            let container = document.createElement('div');
            container.className = "tab-title-banner";
            container.innerHTML = innerHtml;
            
            if(!tab.active) container.style = "display: none;";

            // add to the data map
            tab.bannerEl = container;

            // insert before form
            tab.el.parentNode.insertBefore(container, tab.el);
        },  
        addTabLogic(tabName, onLoadFn) {
            try {
                if(ALYAForm.map.data == null) ALYAForm.map.get();
                
                // identify the tab
                let tab = null;
                for(const t of ALYAForm.map.data.tabs) {
                    if(t.name === tabName) {
                        tab = t;
                        break;
                    }
                }
                // make sure the tab is valid
                if(tab == null) throw new Error(`The form does not have a tab named ${tabName}`);

                // functions to run when the tab is entered
                if(!tab.onLoadEvents) tab.onLoadEvents = new Array();
                tab.onLoadEvents.push(onLoadFn);

            } catch(e) { console.log("Portal Error: ", e.message); }
        }, 
        onclickTab(evt) {
            let caller = evt.target;
            if(caller == null) return;
            
            let tabName = caller.dataset.tabname; 
            if(tabName == null) return;

            let curActiveTab = "";
            for(const tab of ALYAForm.map.data.tabs) {
                if(tab.active) curActiveTab = tab.name;

                if(tab.name == tabName) {
                    tab.active = true;
                } else {
                    tab.active = false;
                }
            }

            ALYAForm.tabs2btns.showHideTabs();
            ALYAForm.tabs2btns.showHideSections();
            ALYAForm.tabs2btns.onloadActiveTab();
        },
        onloadActiveTab() {
            let tab = ALYAForm.map.getActiveTab();
            if(!tab) return;
            if(tab.onLoadEvents) {
                for(const fn of tab.onLoadEvents) {
                    fn();
                }
            }
        },
        showHideTabs() {
            if(ALYAForm.map.data == null) ALYAForm.map.get();
            for(const tab of ALYAForm.map.data.tabs) {
                if(tab.active && tab.visible) {
                    tab.el.style = "display: block;";
                    if(tab.bannerEl) tab.bannerEl.style = "display: flex;";
                    tab.tabButton.classList.add("active");
                    if(tab.displayEl != null && !this.hideTabTitles) {
                        tab.displayEl.style = "display: block;";
                    }
                } else {
                    tab.el.style = "display: none;";
                    if(tab.bannerEl) tab.bannerEl.style = "display: none;";
                    tab.tabButton.classList.remove("active");
                    if(tab.displayEl != null || this.hideTabTitles) {
                        tab.displayEl.style = "display: none;";
                    }
                }
            }
        },

        showHideSections() {
            if(ALYAForm.map.data == null) ALYAForm.map.get();
            if(this.overrideSectionVisibility) {
                for(const tab of ALYAForm.map.data.tabs) {
                    for(const sec of tab.sections) {
                        if(tab.visible && sec.visible) {
                            sec.el.style = "display: block;";
                        } else {
                            sec.el.style = "display: none;";
                        }
                    }
                }
            }
        },
            
        lockTabs(tabsArr, isLocked) {
            if(!tabsArr) return;
            
            if(!Array.isArray(tabsArr)) {
                this.lockTab(tabsArr, isLocked);
                return;
            }

            for(const t of tabsArr) {
                this.lockTab(t, isLocked);
            }
        },

        lockTab(tabsArr, isLocked) {
            if(ALYAForm.map.data == null) ALYAForm.map.get();
            for(const tab of ALYAForm.map.data.tabs) {        
                if(tabsArr.toLowerCase() == tab.name.toLowerCase()) {
                    if(isLocked) {
                        tab.tabButton.removeEventListener('click', this.onclickTab);
                        tab.tabButton.style = "pointer-events: none;";
                    } else {
                        tab.tabButton.addEventListener('click', this.onclickTab);
                        tab.tabButton.style = "";
                    }
                }
            }
        },
    },
    val: {
        isGuid(val) {
            let regex = new RegExp(/^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$/);
            if(!val) return false;
            return regex.test(val);
        },

        isString(val) {
            return typeof val === 'string' || val instanceof String;
        },

        isDate(dateObj) {
            if(!dateObj) return false;
            if(typeof(dateObj) === "object") {
                if(dateObj.getMonth !== "function") return false;
            }

            if(typeof(dateObj) !== "object") {
                let newDt = new Date(dateObj);
                if(typeof(newDt) !== 'object' || !newDt.getMonth)
                    return false;
            }
            
            return true;
        },

        formatTime(inDatetime) {
            if(!this.isDate(inDatetime)) return "T00:00:00.0000000Z";
            
            let hrs = "00";
            let mins = "00";
            let secs = "00";

            hrs = (hrs + inDatetime.getUTCHours().toString()).slice(-2);
            mins = (mins + inDatetime.getUTCMinutes().toString()).slice(-2);
            secs = (secs + inDatetime.getUTCSeconds().toString()).slice(-2);

            return `T${hrs}:${mins}:${secs}.0000000Z`;
        },

        // takes out illegal escape chars from a string for serialization
        jsonEscape(str) {
            return str.replace("\b", "").replace("\f", "").replace("\n", "").replace("\r", "").replace("\t", "\\t").replace("\v", "").replace("\'", "\\'").replace(`\"`, `\\"`);
        }
    },

    html: {
        anyElement(id) {
            if(!id) return null;
            return document.getElementById(id);
        },
        getElement(attrName, tagName, typeName, findInEl) {
            try {
                let el = document.getElementById(attrName);
                if(findInEl != null) {
                    el = findInEl.getElementById(attrName);
                } 
                
                if(!el) throw new Error("The field name is not valid.");
                if(el.tagName.toLowerCase() !== tagName.toLowerCase()) throw new Error(`The element is not an ${tagName} type.`);
                if(typeName != null && tagName.toLowerCase() === "input" && el.type !== typeName.toLowerCase()) throw new Error(`The input is not a ${typeName} input.`);
                return el;
            } catch (e) {
                console.log("Portal Error: ", e);
            }
        },
        getSection(sectionName, findInEl) {
            try {
                let sectionQuery = document.querySelector(`[data-name="${sectionName}"]`);
                if(findInEl != null) {
                    sectionQuery = findInEl.querySelector(`[data-name="${sectionName}"]`);
                }

                if(!sectionQuery) throw new Error(`No section name exists for ${sectionName}`);
                return sectionQuery.parentElement;
            } catch (e) {
                console.log("Portal Error: ", e);
            }
        },
        getSelect(selectEl) {
            if(!selectEl) return null;
            if(selectEl.tagName.toLowerCase() != "select") return null;

            return { 
                value: firstEl.options[firstEl.selectedIndex].value,
                display: firstEl.options[firstEl.selectedIndex].text
            }
        },
        setSelectValue(selectEl, value) {
            if(!selectEl) return;
            if(selectEl.tagName.toLowerCase() != "select") return;

            let chkVal = value;
            if(typeof(value) != "string") chkVal = value.toString();

            for(let o = 0; o < selectEl.options.length; o++) {
                let opt = selectEl.options[o];
                
                // set by text
                if(isNaN(chkVal) && opt.text.toLowerCase() === chkVal.toLowerCase()) {
                    selectEl.selectedIndex = o;
                    break;
                }

                if(opt.value === chkVal) {
                    selectEl.selectedIndex = o;
                    break;
                }
            }
        },
        getTableColumns(elTable) {
            if(!elTable || elTable.tagName.toLowerCase() !== 'table') return null; 
            let outArr = new Array();
            let columns = elTable.querySelectorAll('th');
            for(let c = 0; c < columns.length; c++) {
                let col = columns[c];
                if(!col.firstElementChild.getAttribute('aria-label')) continue;

                outArr.push({
                    label: col.firstElementChild.getAttribute('aria-label')
                });
            }

            if(outArr.length > 0) return outArr;
            return null;
        },
        getTableRows(elTable) {
            if(!elTable || elTable.tagName.toLowerCase() !== 'table') return null;
            let outArr = new Array();

            let rows = elTable.querySelectorAll('tbody tr');
            for(let r = 0; r < rows.length; r++) {
                let row = rows[r];
                let newRow = {};
                if(!row.dataset.id) continue;
                newRow.entity = {
                    id: row.dataset.id,
                    name: row.dataset.name,
                    entityname: row.dataset.entity
                };
                newRow.fields = this.getRowFields(row);
                outArr.push(newRow);

            }

            if(outArr.length > 0) return outArr;
            return null;
        },
        getRowFields(elRow) {
            if(!elRow || elRow.tagName.toLowerCase() === 'tr') return null;


        }
    },

    fn: {
        async setAllTooltips(fnUrl, entity, fieldsArr) {

            // get entity information
            if(fieldsArr == null) fieldsArr = new Array();
            ALYAForm.meta = await ALYAForm.fn.callAzureFn(fnUrl, {
                entity: entity,
                fields: fieldsArr
            });
            
            for(let i = 0; i < ALYAForm.meta.Attributes.length; i++) {
                let atr = ALYAForm.meta.Attributes[i];
                
                let ctl = ALYAForm.html.anyElement(atr.name);
                if(ctl == null) continue;

                try {
                    ALYAForm.setTooltip(atr.name, atr.userDescription);
                } catch(e){
                    console.log("tooltip error: ", e);
                }
            }
        },

        async callAzureFn(url, json) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(json)
                });
                let responseJson = await response.json();
                if(responseJson == null) return null;
                if(responseJson.ok) {
                    let json = JSON.parse(responseJson.data);   
                    return json;
                }
                return null;
            } catch (e) {
                console.log(e);
            }
        },

        async fetch(url) {
            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                return await response.json();
            } catch (e) {
                console.log(e);
            }
        },

        async fetchRaw(url) {
            try {
                return await fetch(url, {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
            } catch (e) {
                console.log(e);
            }
        }
    }
} 
