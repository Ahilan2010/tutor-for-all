/* Tutor-For-All: helpers for people signing up from anywhere in the world.
   Shared by the family form, the tutor form and the onboarding page.
   - Fills the country list with every country, named in the page's language.
     The value sent to us stays the English name.
   - Sets the time zone from the device, and offers every zone in the world.
   - Tells the form which language page the person used. */
(function () {
    var COUNTRIES = 'AF|Afghanistan|93,AL|Albania|355,DZ|Algeria|213,AO|Angola|244,AG|Antigua and Barbuda|1,AR|Argentina|54,AM|Armenia|374,AU|Australia|61,AT|Austria|43,AZ|Azerbaijan|994,BS|Bahamas|1,BH|Bahrain|973,BD|Bangladesh|880,BB|Barbados|1,BY|Belarus|375,BE|Belgium|32,BZ|Belize|501,BJ|Benin|229,BT|Bhutan|975,BO|Bolivia|591,BA|Bosnia and Herzegovina|387,BW|Botswana|267,BR|Brazil|55,BN|Brunei|673,BG|Bulgaria|359,BF|Burkina Faso|226,BI|Burundi|257,CV|Cabo Verde|238,KH|Cambodia|855,CM|Cameroon|237,CA|Canada|1,CF|Central African Republic|236,TD|Chad|235,CL|Chile|56,CN|China|86,CO|Colombia|57,KM|Comoros|269,CG|Congo|242,CD|DR Congo|243,CR|Costa Rica|506,CI|Ivory Coast|225,HR|Croatia|385,CU|Cuba|53,CY|Cyprus|357,CZ|Czechia|420,DK|Denmark|45,DJ|Djibouti|253,DM|Dominica|1,DO|Dominican Republic|1,EC|Ecuador|593,EG|Egypt|20,SV|El Salvador|503,GQ|Equatorial Guinea|240,ER|Eritrea|291,EE|Estonia|372,SZ|Eswatini|268,ET|Ethiopia|251,FJ|Fiji|679,FI|Finland|358,FR|France|33,GA|Gabon|241,GM|Gambia|220,GE|Georgia|995,DE|Germany|49,GH|Ghana|233,GR|Greece|30,GD|Grenada|1,GT|Guatemala|502,GN|Guinea|224,GW|Guinea-Bissau|245,GY|Guyana|592,HT|Haiti|509,HN|Honduras|504,HK|Hong Kong|852,HU|Hungary|36,IS|Iceland|354,IN|India|91,ID|Indonesia|62,IR|Iran|98,IQ|Iraq|964,IE|Ireland|353,IL|Israel|972,IT|Italy|39,JM|Jamaica|1,JP|Japan|81,JO|Jordan|962,KZ|Kazakhstan|7,KE|Kenya|254,KI|Kiribati|686,XK|Kosovo|383,KW|Kuwait|965,KG|Kyrgyzstan|996,LA|Laos|856,LV|Latvia|371,LB|Lebanon|961,LS|Lesotho|266,LR|Liberia|231,LY|Libya|218,LI|Liechtenstein|423,LT|Lithuania|370,LU|Luxembourg|352,MO|Macao|853,MG|Madagascar|261,MW|Malawi|265,MY|Malaysia|60,MV|Maldives|960,ML|Mali|223,MT|Malta|356,MH|Marshall Islands|692,MR|Mauritania|222,MU|Mauritius|230,MX|Mexico|52,FM|Micronesia|691,MD|Moldova|373,MC|Monaco|377,MN|Mongolia|976,ME|Montenegro|382,MA|Morocco|212,MZ|Mozambique|258,MM|Myanmar|95,NA|Namibia|264,NR|Nauru|674,NP|Nepal|977,NL|Netherlands|31,NZ|New Zealand|64,NI|Nicaragua|505,NE|Niger|227,NG|Nigeria|234,KP|North Korea|850,MK|North Macedonia|389,NO|Norway|47,OM|Oman|968,PK|Pakistan|92,PW|Palau|680,PS|Palestine|970,PA|Panama|507,PG|Papua New Guinea|675,PY|Paraguay|595,PE|Peru|51,PH|Philippines|63,PL|Poland|48,PT|Portugal|351,PR|Puerto Rico|1,QA|Qatar|974,RO|Romania|40,RU|Russia|7,RW|Rwanda|250,KN|Saint Kitts and Nevis|1,LC|Saint Lucia|1,VC|Saint Vincent and the Grenadines|1,WS|Samoa|685,SM|San Marino|378,ST|Sao Tome and Principe|239,SA|Saudi Arabia|966,SN|Senegal|221,RS|Serbia|381,SC|Seychelles|248,SL|Sierra Leone|232,SG|Singapore|65,SK|Slovakia|421,SI|Slovenia|386,SB|Solomon Islands|677,SO|Somalia|252,ZA|South Africa|27,KR|South Korea|82,SS|South Sudan|211,ES|Spain|34,LK|Sri Lanka|94,SD|Sudan|249,SR|Suriname|597,SE|Sweden|46,CH|Switzerland|41,SY|Syria|963,TW|Taiwan|886,TJ|Tajikistan|992,TZ|Tanzania|255,TH|Thailand|66,TL|Timor-Leste|670,TG|Togo|228,TO|Tonga|676,TT|Trinidad and Tobago|1,TN|Tunisia|216,TR|Turkey|90,TM|Turkmenistan|993,TV|Tuvalu|688,UG|Uganda|256,UA|Ukraine|380,AE|United Arab Emirates|971,GB|United Kingdom|44,US|United States|1,UY|Uruguay|598,UZ|Uzbekistan|998,VU|Vanuatu|678,VE|Venezuela|58,VN|Vietnam|84,YE|Yemen|967,ZM|Zambia|260,ZW|Zimbabwe|263'
        .split(',').map(function (s) { var p = s.split('|'); return { code: p[0], name: p[1], dial: p[2] }; });

    // Zones that already have an option on the form. Anything else is sent by its own name (America/Jamaica).
    var ZONE_OPTION = {
        'America/New_York': 'US – Eastern (ET)', 'America/Detroit': 'US – Eastern (ET)', 'America/Kentucky/Louisville': 'US – Eastern (ET)',
        'America/Indiana/Indianapolis': 'US – Eastern (ET)', 'America/Toronto': 'US – Eastern (ET)', 'America/Montreal': 'US – Eastern (ET)',
        'America/Chicago': 'US – Central (CT) – same as Houston', 'America/Winnipeg': 'US – Central (CT) – same as Houston',
        'America/Denver': 'US – Mountain (MT)', 'America/Boise': 'US – Mountain (MT)', 'America/Phoenix': 'US – Arizona (MST, no daylight saving)',
        'America/Los_Angeles': 'US – Pacific (PT)', 'America/Anchorage': 'US – Alaska (AKT)', 'Pacific/Honolulu': 'US – Hawaii (HST)',
        'America/Edmonton': 'Canada – Alberta', 'America/Vancouver': 'Canada – British Columbia', 'America/Halifax': 'Canada – Atlantic (AT) – -4',
        'America/St_Johns': 'Newfoundland (NST) – -3:30', 'America/Regina': 'Canada – Saskatchewan (CST, no daylight saving)',
        'America/Whitehorse': 'Canada – Yukon (MST, no daylight saving)', 'America/Mexico_City': 'Mexico City (CST) – -6',
        'America/Cancun': 'Mexico – Cancún / Quintana Roo (EST) – -5', 'America/Hermosillo': 'Mexico – Sonora (MST) – -7',
        'America/Puerto_Rico': 'Caribbean / Puerto Rico / Dominican Rep. (AST) – -4', 'America/Santo_Domingo': 'Caribbean / Puerto Rico / Dominican Rep. (AST) – -4',
        'America/Bogota': 'Colombia / Peru (COT) – -5', 'America/Lima': 'Colombia / Peru (COT) – -5', 'America/Sao_Paulo': 'Brazil (BRT) – -3',
        'America/Manaus': 'Brazil – Amazonas / Manaus (AMT) – -4', 'America/Argentina/Buenos_Aires': 'Argentina (ART) – -3', 'America/Buenos_Aires': 'Argentina (ART) – -3',
        'America/Santiago': 'Chile (CLT)', 'Africa/Casablanca': 'Morocco (WET)', 'Africa/Accra': 'Ghana / West Africa (GMT) – +0',
        'Africa/Lagos': 'West Africa (WAT) – Nigeria, Cameroon +1', 'Africa/Harare': 'Central Africa (CAT) – +2', 'Africa/Johannesburg': 'South Africa (SAST) – +2',
        'Africa/Cairo': 'Egypt (EET) – +2', 'Africa/Nairobi': 'East Africa (EAT) – Kenya +3', 'Europe/London': 'United Kingdom (GMT/BST)',
        'Europe/Madrid': 'Spain / France (CET)', 'Europe/Paris': 'Spain / France (CET)', 'Europe/Berlin': 'Central Europe (CET)', 'Europe/Kyiv': 'Eastern Europe (EET)', 'Europe/Kiev': 'Eastern Europe (EET)',
        'Asia/Riyadh': 'Saudi Arabia / Qatar / Kuwait / Iraq / Turkey (+3)', 'Asia/Jerusalem': 'Israel (IST/IDT)', 'Asia/Tehran': 'Iran (IRST) – +3:30', 'Asia/Dubai': 'Gulf (GST) – +4',
        'Asia/Kabul': 'Afghanistan (AFT) – +4:30', 'Asia/Karachi': 'Pakistan (PKT) – +5', 'Asia/Kolkata': 'India (IST) – +5:30', 'Asia/Calcutta': 'India (IST) – +5:30',
        'Asia/Colombo': 'Sri Lanka (SLST) – +5:30', 'Asia/Kathmandu': 'Nepal (NPT) – +5:45', 'Asia/Katmandu': 'Nepal (NPT) – +5:45', 'Asia/Dhaka': 'Bangladesh (BST) – +6',
        'Asia/Yangon': 'Myanmar (MMT) – +6:30', 'Asia/Rangoon': 'Myanmar (MMT) – +6:30', 'Asia/Bangkok': 'Vietnam / Thailand / Cambodia (ICT) – +7',
        'Asia/Jakarta': 'Indonesia – Jakarta (WIB) +7', 'Asia/Singapore': 'China / Singapore (+8)', 'Asia/Manila': 'Philippines (PHT) – +8',
        'Australia/Perth': 'Western Australia – Perth (AWST) – +8', 'Asia/Tokyo': 'Japan / Korea (+9)', 'Asia/Seoul': 'Japan / Korea (+9)',
        'Australia/Darwin': 'Northern Territory – Darwin (ACST, no daylight saving) – +9:30', 'Australia/Adelaide': 'Central Australia (ACST)',
        'Australia/Brisbane': 'Queensland – Brisbane (AEST, no daylight saving) – +10', 'Australia/Sydney': 'Eastern Australia (AET)', 'Australia/Melbourne': 'Eastern Australia (AET)',
        'Pacific/Auckland': 'New Zealand (NZT)'
    };

    var root = document.documentElement;
    var lang = (root.getAttribute('lang') || 'en').split('-')[0];
    var strings = {};
    try { strings = JSON.parse(document.getElementById('tfa-strings').textContent); } catch (e) { /* page has none */ }
    function t(key, fallback) { return strings[key] || fallback; }

    function namesIn(code) {
        try { return new Intl.DisplayNames([root.getAttribute('lang') || 'en'], { type: 'region' }).of(code); }
        catch (e) { return ''; }
    }

    // Every country, in the page's language. Value = the English name (what the sheet and the matching code read).
    function fillCountries(select) {
        var current = select.value;
        var keepOther = select.querySelector('option[value="Other"]');
        var other = keepOther ? keepOther.textContent : 'Other';
        var first = select.querySelector('option[value=""]');
        var list = COUNTRIES.map(function (c) { return { name: c.name, dial: c.dial, label: (lang === 'en' ? c.name : namesIn(c.code)) || c.name }; });
        var sorter = (window.Intl && Intl.Collator) ? new Intl.Collator(root.getAttribute('lang') || 'en').compare : function (a, b) { return a < b ? -1 : 1; };
        list.sort(function (a, b) { return sorter(a.label, b.label); });
        select.innerHTML = '';
        if (first) select.appendChild(first);
        list.forEach(function (c) {
            var o = document.createElement('option');
            o.value = c.name; o.textContent = c.label; o.setAttribute('data-dial', c.dial);
            select.appendChild(o);
        });
        var o = document.createElement('option');
        o.value = 'Other'; o.textContent = other;
        select.appendChild(o);
        if (current) select.value = current;
    }

    function deviceZone() {
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
    }

    function clockIn(zone) {
        try { return new Intl.DateTimeFormat(root.getAttribute('lang') || 'en', { hour: 'numeric', minute: '2-digit', timeZone: zone }).format(new Date()); }
        catch (e) { return ''; }
    }

    function zoneLabel(zone) {
        var city = zone.split('/').pop().replace(/_/g, ' ');
        var now = clockIn(zone);
        return city + (now ? ' (' + now + ')' : '');
    }

    // Adds a zone by its own name at the top of the list and selects it.
    function chooseZone(select, zone, label) {
        var found = Array.prototype.filter.call(select.options, function (o) { return o.value === zone; })[0];
        if (!found) {
            found = document.createElement('option');
            found.value = zone; found.textContent = label || zoneLabel(zone);
            var first = select.querySelector('option[value=""]');
            if (first) first.parentNode.insertBefore(found, first.nextSibling);
            else select.insertBefore(found, select.firstChild);
        }
        select.value = zone;
    }

    function setupZone(select) {
        var note = select.parentNode.querySelector('[data-zone-note]');
        var allGroup = select.parentNode.querySelector('[data-zone-all]');
        var allSelect = allGroup ? allGroup.querySelector('select') : null;
        var zone = deviceZone();
        if (zone && !select.value) {
            if (ZONE_OPTION[zone]) select.value = ZONE_OPTION[zone];
            else chooseZone(select, zone);
            if (note && select.value) { note.hidden = false; }
            select.dispatchEvent(new Event('change'));
        }
        // "Other": every zone in the world, so nobody has to type one.
        if (allSelect && Intl.supportedValuesOf) {
            var filled = false;
            select.addEventListener('change', function () {
                var isOther = /^Other/.test(select.value);
                allGroup.hidden = !isOther;
                if (isOther && !filled) {
                    filled = true;
                    Intl.supportedValuesOf('timeZone').forEach(function (z) {
                        if (/^Etc\//.test(z)) return;
                        var o = document.createElement('option');
                        o.value = z; o.textContent = z.replace(/_/g, ' ').replace('/', ' / ');
                        allSelect.appendChild(o);
                    });
                }
            });
            allSelect.addEventListener('change', function () {
                if (!allSelect.value) return;
                chooseZone(select, allSelect.value);
                allGroup.hidden = true;
                select.dispatchEvent(new Event('change'));
            });
        }
    }

    // Country-based parts of a form: the phone hint, whether State is required, and the US / outside-the-US questions.
    function setupCountry(form, select) {
        var phone = form.querySelector('input[type="tel"]');
        var state = form.querySelector('input[name="state"]');
        var stateMark = form.querySelector('[data-state-req]');
        var basePlaceholder = phone ? phone.placeholder : '';
        function sync() {
            var opt = select.options[select.selectedIndex];
            var dial = opt ? opt.getAttribute('data-dial') : '';
            if (phone) phone.placeholder = dial ? '+' + dial + ' ...' : basePlaceholder;
            var isUS = select.value === 'United States';
            var needsState = isUS || select.value === 'Canada';
            if (state) { state.required = needsState; if (stateMark) stateMark.hidden = !needsState; }
            form.querySelectorAll('[data-show-for]').forEach(function (block) {
                var show = block.getAttribute('data-show-for') === (isUS ? 'us' : 'intl');
                block.hidden = !show;
                block.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = !show; });
            });
        }
        select.addEventListener('change', sync);
        sync();
        return sync;
    }

    window.TFA = {
        t: t,
        lang: lang,
        // Reads the website's answer: a saved request says {"ok":true}.
        accepted: function (response) {
            if (!response.ok) return Promise.resolve(false);
            return response.text().then(function (text) {
                try { return JSON.parse(text).ok !== false; } catch (e) { return true; }
            });
        },
        setupForm: function (form) {
            if (!form) return;
            var site = form.querySelector('input[name="site_language"]');
            if (site) site.value = root.getAttribute('lang') || 'en';
            var country = form.querySelector('select[name="country"]');
            var zone = form.querySelector('select[name="timezone"]');
            if (country) { fillCountries(country); setupCountry(form, country); }
            if (zone) setupZone(zone);
        }
    };
})();
