from flask import Blueprint, jsonify
from utils.config_loader import get_config
from datetime import datetime, timedelta
from dateutil.rrule import rrulestr
import caldav

calendar_bp = Blueprint("calendar", __name__, url_prefix="/api/calendar")

@calendar_bp.route("/today")
def get_todays_events():
    try:
        ic = get_config("icloud", {})
        username, password = ic.get("username"), ic.get("app_password")

        if not username or not password:
            return jsonify({"status": "error", "message": "Credenziali mancanti"})

        client = caldav.DAVClient(url="https://caldav.icloud.com", username=username, password=password)
        principal = client.principal()
        calendars = principal.calendars()

        now = datetime.now().astimezone()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        events = []

        for calendar in calendars:
            name = getattr(calendar, 'name', '')
            if "Promemoria" in name:
                continue

            results = calendar.search(start=today_start, end=today_end)
            for event in results:
                vobj = getattr(event, 'vobject_instance', None)
                if vobj is None or not hasattr(vobj, 'vevent'):
                    continue
                vevent = vobj.vevent
                summary = getattr(vevent, 'summary', None)
                dtstart = getattr(vevent, 'dtstart', None)
                dtend = getattr(vevent, 'dtend', None)
                rrule = getattr(vevent, 'rrule', None)
                if not dtstart:
                    continue
                start_time = dtstart.value
                end_time = dtend.value if dtend else start_time
                if not isinstance(start_time, datetime):
                    start_time = datetime.combine(start_time, datetime.min.time()).replace(tzinfo=now.tzinfo)
                if not isinstance(end_time, datetime):
                    end_time = datetime.combine(end_time, datetime.min.time()).replace(tzinfo=now.tzinfo)

                if rrule:
                    rule_text = "RRULE:" + rrule.value
                    rule = rrulestr(rule_text, dtstart=start_time)
                    occurrences = list(rule.between(today_start, today_end, inc=True))
                    for occ in occurrences:
                        occ_end = occ + (end_time - start_time)
                        if occ_end >= now:
                            events.append({"summary": str(summary.value) if summary else "Senza titolo",
                                           "start": occ.isoformat(),
                                           "end": occ_end.isoformat()})
                else:
                    if end_time >= now:
                        events.append({"summary": str(summary.value) if summary else "Senza titolo",
                                       "start": start_time.isoformat(),
                                       "end": end_time.isoformat()})

        return jsonify({"status": "ok", "events": events})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})