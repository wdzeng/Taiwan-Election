import * as Leg from "/js/tw-leg-ectr.js";
import * as Town from "/js/tw-town.js";

/** 
 * Please follow the belowing html rules.
 *  
 * Dropdowns
 *   Election dropdown   .sec-election
 *     |- Legislator election options               [value="YYYY-leg]   
 *     |- President election options options        [value="YYYY-prs]   
 *     |- Party listed legislator election options  [value="YYYY-par]   
 *     |- Local election options                    [value="YYYY-lcl]   
 *     |- Refernedum options                        [value="2018-ref]   
 *   Referendum dropdown .sec-referenum  .r-only
 *   County dropdown     .sec-county
 *   Electoral dropdown  .sec-electoral  .leg-only
 *   Town dropdown       .sec-town       .nlg-only
 *   Granule             .sec-granule
 *     |- county     [value="c"]
 *     |- electoral  [value="e"]         .leg-only
 *     |- town       [value="d"]         .nlg-only
 *     |- village    [value="v"]
 * 
 * Radio groups
 *   [name="search-target"]
 *      leader   [value="lead"]
 *      elect    [value="elect"]
 *      for      [value="for"]           .r-only
 *      agaisnt  [value="against"]       .r-only
 *      custom   [value="other"]         .e-only
 *         textarea  .txt-custom         .e-only
 *   [name="coloring"]
 *      one           [value="one"]
 *      soft ratio    [value="soft"]
 *      strict ratio  [value="strict"]
 */

export function initFormGroup($g) {

    /* Referendum and legislator selection mode check */

    function refreshForm(enabledClassName, disabledClassName) {
        // Reset classes
        $g.addClass(enabledClassName).removeClass(disabledClassName);
        // Refresh radio buttons
        $g.find(`input[type="radio"].${disabledClassName}:checked`)
            // Select first valid radio button
            .each(r => {
                $(r).parent("fieldset")
                    .find(`input[type='radio']:not(.${disabledClassName}:first`)
                    .prop("checked", true);
            });
        // Refresh dropdowns
        $g.find("select")
            // Filter dropdowns which currently select an invalid option
            .filter(function (index) {
                return $(this).find(":selected").is(`.${disabledClassName}`);
            })
            // Select first valid option
            .each((index, s) => {
                let $s = $(s),
                    $firstOption = $(s).find(`option:not(.${disabledClassName}):first`);
                $s.val($firstOption.val());
            });
        enableOption($g.find(`option.${disabledClassName}`), false);
        enableOption($g.find(`option.${enabledClassName}`), true);
    }

    const setLegMode = (function () {
        let val = false;
        return function (flag) {
            if (flag === val) return;
            val = flag;
            if (flag) refreshForm("leg-only", "nlg-only");
            else refreshForm("nlg-only", "leg-only");
        }
    })();

    const setRefMode = (function () {
        let val = false;
        return function (flag) {
            if (flag === val) return;
            val = flag;
            if (flag) refreshForm("r-only", "e-only");
            else refreshForm("e-only", "r-only");
        }
    })();

    $g.find("select.sec-election").change(function () {
        let selected = $(this).val();
        setRefMode(selected === "2018-ref");
        setLegMode(selected.includes("leg"));
    });

    /* Electoral and town dropdowns' refreshing */

    function refreshElectoralDropdown(countyCode) {
        // Whole Taiwan
        if (countyCode == 0) {
            $g.find("select.sec-ectr").html("<option value='0'>全境</option>");
            return;
        }
        // Some county
        let ectrs = Leg.getAllElectorals(),
            nEctr = ectrs.filter(e => countyCode < e && e < (countyCode + 100)).length,
            html = "<option value='0'>全境</option>";
        for (let i = 1; i <= nEctr; i++)
            html += `<option value="${countyCode + i}">${insertZero(i, 2)} 選區</option>`;
        $g.find("select.sec-ectr").html(html);
    }

    function refreshTownDropdown(countyCode) {
        if (countyCode == 0) {
            $g.find("select.sec-town").html("<option value='0'>全境</option>");
            return;
        }
        let townIds = Town.getAllTownIds().filter(id => countyCode < id && id < (countyCode + 100)),
            html = "<option value='0'>全境</option>";
        townIds.forEach(id => html += `<option value="${id}">${Town.getTownNameById(id).substring(3)}</option>`);
        $g.find("select.sec-town").html(html);
    }

    $g.find("select.sec-county").change(function () {
        const countyCode = Number($(this).val());
        refreshTownDropdown(countyCode);
        refreshElectoralDropdown(countyCode);
    })

    /* Granule dropdown's refreshing */

    function refreshGranule() {
        // Check selected town or electral id
        let legMode = isLegMode(),
            $etDropdown = legMode ? $g.find("select.sec-ectr") : $g.find("select.sec-town"),
            $granuleDropdown = $g.find("select.sec-granule"),
            id = $etDropdown.val();
        if (id != 0) {
            // If currently selecting county granule, set to town or electoral granule
            let granule = $g.find("select.sec-granule").val();
            if (granule === "c") {
                $granuleDropdown.val(legMode ? "e" : "d");
            }
        }
        // Enable or disable the county option
        enableOption($granuleDropdown.find("option[value='c']"), id == 0);
    }
    $g.find("select.sec-county, select.sec-town, select.sec-ectr")
        .change(refreshGranule);

    /* Custom seaching textarea */

    // When custom search radio button is checked / unchcked, reset its ability
    $g.find("input[name='search-target']").change(function () {
        $g.find("input.txt-custom").prop("disabled", $(this).val() !== "other");
    });
    // When toggle to referndum searching, check if this radio is checked
    $g.find("select.sec-election").change(function () {
        if ($g.find("input[name='search-target'][value='other']").is(":checked") && $(this).val() === "2018-ref") {
            $g.find("input[name='search-target']:first")
                .prop("checked", true)
                .trigger("change");
        }
    })

    /* Init */
    refreshForm("e-only", "r-only");
    refreshForm("nlg-only", "leg-only");

    /* others */

    function isLegMode() {
        return $g.find("select.sec-election").val().includes("leg");
    }

    function enableOption($option, flag) {
        if (flag) {
            $option.prop("disabled", false);
            return;
        }
        $option.prop("disabled", true);
        $select = $option.parent("select");
        $select.val($select.find("option:first").val());
    }
}

function insertZero(val, len) {
    val = val.toString();
    for (let i = len - val.length; i > 0; i--)
        val = '0' + val;
    return val;
}