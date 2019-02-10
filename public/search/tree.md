# Elections

select.sec-election
 |- option[value="2008-leg"] (2008 legislator)
 |- option[value="2008-par"] (2008 party listed legislator)
 |- option[value="2008-prs"] (2008 president)
 |- ...
 |- option[value="2018-lcl"] (2018 local)
 |- option[value="2018-ref"] (2018 referendum)

select.sec-referendum.r-only
 |- options

select.sec-county 
 |- options

select.sec-ectr.leg-only
 |- options

select.sec-town.nlg-only
 |- options

select.sec-granule
 |- option[value="c"] (county)
 |- option.leg-only[value="e"] (electoral)
 |- option.nlg-only[value="d"] (town)
 |- option[value="v"] (village)

fieldset.search-target (查詢對象)
 |- radio[value="lead"]
 |- label
     |- span.e-only 領先者
     |- span.r-only 領先方
 |- radio[value="elect"]
 |- label
     |- span.e-only 當選者
     |- span.r-only 勝方
 |- radio.r-only[value="for"]
 |- label
     |- span.r-only 正方
 |- radio.r-only[value="against"]
 |- label
     |- span.r-only 反方
 |- radio[value="other"]
 |- text.txt-custom

fieldset.coloring
 |- radio[value="one"]
 |- radio[value="soft"]
 |- radio[value="strict"]
