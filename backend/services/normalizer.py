from datetime import datetime, timezone

def event(loc, typ, sev, desc, value=None, unit=None):
    cur=loc.get("current",{})
    return {"id":f"{loc['city']}-{typ}-{cur.get('time',datetime.now(timezone.utc).isoformat())}","eventType":typ,"location":loc["city"],"region":loc["state"],"latitude":loc["lat"],"longitude":loc["lon"],"date":cur.get("time"),"severity":sev,"description":desc,"value":value,"unit":unit,"source":"Open-Meteo","live":True,"derived":True}

def build_live_events(data):
    out=[]
    for loc in data.get("locations",[]):
        cur=loc.get("current",{}); temp=cur.get("temperature_2m"); wind=cur.get("wind_gusts_10m"); rain=cur.get("precipitation"); code=cur.get("weather_code")
        if temp is not None and temp>=45: out.append(event(loc,"Extreme Heat","Extreme",f"Temperature reached {temp}°C.",temp,"°C"))
        elif temp is not None and temp>=40: out.append(event(loc,"High Heat","High",f"Temperature reached {temp}°C.",temp,"°C"))
        if wind is not None and wind>=90: out.append(event(loc,"Severe Wind","Extreme",f"Wind gusts reached {wind} km/h.",wind,"km/h"))
        elif wind is not None and wind>=60: out.append(event(loc,"Strong Wind","High",f"Wind gusts reached {wind} km/h.",wind,"km/h"))
        if rain is not None and rain>=15: out.append(event(loc,"Heavy Rain","High",f"Recent precipitation reached {rain} mm.",rain,"mm"))
        if code in {95,96,99}: out.append(event(loc,"Thunderstorm","High",f"Thunderstorm weather code {code} reported.",code,"WMO code"))
        if code in {65,67,82}: out.append(event(loc,"Heavy Precipitation","High",f"Heavy precipitation weather code {code} reported.",code,"WMO code"))
    return out

def build_live_stats(events):
    by_type={}; by_region={}; severity={}
    for e in events:
        by_type[e["eventType"]]=by_type.get(e["eventType"],0)+1; by_region[e["region"]]=by_region.get(e["region"],0)+1; severity[e["severity"]]=severity.get(e["severity"],0)+1
    return {"totalEvents":len(events),"byType":by_type,"byRegion":by_region,"bySeverity":severity,"updatedAt":datetime.now(timezone.utc).isoformat(),"source":"Open-Meteo","derived":True}
