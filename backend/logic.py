import webbrowser
import subprocess
import requests
import json
import sys
from termcolor import colored
import os
import psutil
from utils.freetts import speak
from datetime import datetime, time, timedelta
from icalendar import Calendar, Event
from caldav import DAVClient
import uuid
from pytz import timezone as pytz_timezone, UTC # 'timezone' qui è la funzione di pytz, UTC è l'oggetto UTC. 
from utils.config_loader import get_config
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled, VideoUnavailable
from groq import Groq
from urllib.parse import urlparse, parse_qs
import time
from utils.run_applescript import run_applescript


weather_api_key = get_config("weather_api_key")
wakeword = get_config("wake_word")
wolfram_appid = get_config("wolframalpha_api_key")
icloud_username = get_config("icloud", {}).get("username")
icloud_app_password = get_config("icloud", {}).get("app_password")
SERPAPI_API_KEY = get_config("serpapi_api_key")
groq_api_key = get_config("groq_api_key")


def open_website(sito):
    # Pulizia input
    sito = sito.strip().lower()

    # Aggiunge https:// se manca
    if not sito.startswith("http://") and not sito.startswith("https://"):
        # Se contiene un punto (.), presumiamo sia un dominio valido
        if "." in sito:
            url = f"https://{sito}"
        else:
            # Default: .com
            url = f"https://{sito}.com"
    else:
        url = sito

    print(f"Apro il sito: {url}")
    webbrowser.open(url)

def restart():
    python = sys.executable
    os.execl(python, python, *sys.argv)

def shutdown():
    subprocess.run(["osascript", "-e", 'tell app "System Events" to shut down'])

def logout():
    subprocess.run(["osascript", "-e", 'tell application "System Events" to log out'])

def open_terminal():
    subprocess.run(["open", "-a", "iTerm"])

def open_finder():
    subprocess.run(["open", "-a", "Finder"])

def open_settings():
    subprocess.run(["open", "-a", "System Preferences"])

def open_calculator():
    subprocess.run(["open", "-a", "Calculator"])

def open_note_editor():
    subprocess.run(["open", "-a", "Notes"])

def open_spotify():
    subprocess.run(["open", "-a", "Spotify"])

def open_browser():
    subprocess.run(["open", "-a", "Firefox"])

def open_mail():
    subprocess.run(["open", "-a", "Mail"])

def open_calendar():
    subprocess.run(["open", "-a", "Calendar"])

def open_clock():
    subprocess.run(["open", "-a", "Clock"])

def get_gps_city():
    for _ in range(5):  # massimo 5 tentativi
        try:
            res = requests.get("http://127.0.0.1:5100/api/get_gps_position")
            city = res.json().get("gps_city")
            if city:
                return city
        except:
            pass
        time.sleep(0.2)  # aspetta 200ms
    return "Roma"  # fallback


def weather(city=None):
    """
    Comando weather: usa la città passata come argomento oppure la prende dal backend Flask.
    """
    if city:
        # Se ricevo la città come argomento, aggiorno anche Flask
        try:
            requests.post(
                "http://127.0.0.1:5100/api/gps_position",
                json={"gps_city": city}
            )
            print(f"✅ Città aggiornata su Flask: {city}")
        except Exception as e:
            print(f"❌ Impossibile aggiornare la città su Flask: {e}")
    else:
        # Nessuna città fornita: recupera da Flask
        city = get_gps_city()
        print(f"🔍 Città determinata tramite GPS: {city}")

    # Chiamata OpenWeatherMap
    base_url = "http://api.openweathermap.org/data/2.5/weather"
    params = {
        'q': city,
        'appid': weather_api_key,
        'units': 'metric',
        'lang': 'it'
    }

    try:
        response = requests.get(base_url, params=params)
        if response.status_code == 200:
            data = response.json()
            weather_description = data['weather'][0]['description']
            temperature = data['main']['temp']
            city_name = data['name']
            country_code = data['sys']['country']
            weather_info = (
                f"Il meteo a {city_name}, {country_code} è: "
                f"{weather_description} con una temperatura di {temperature}°C."
            )
            return weather_info
        else:
            weather_info = "Non sono riuscito a trovare il meteo per la città richiesta."
            print(weather_info)
            return weather_info
    except Exception as e:
        weather_info = f"Errore nel recupero dati meteo: {e}"
        print(weather_info)
        return weather_info

def ip():
    try:
        response = requests.get("https://api.ipify.org?format=json")
        ip_info = response.json()
        print(f"Il tuo IP è: {ip_info['ip']}")
        speak(f"Il tuo IP è: {ip_info['ip']}")
        return(f"Il tuo IP è: {ip_info['ip']}")
    except requests.RequestException as e:
        print(f"Errore nel recupero dell'IP: {e}")
        speak("Errore nel recupero dell'IP.")
        return("Errore nel recupero dell'IP.")

def asitop():

    script = '''
    tell application "iTerm"
        activate
        create window with default profile
        tell current session of current window
            write text "sudo /Library/Frameworks/Python.framework/Versions/3.11/bin/asitop"
        end tell
    end tell
    '''
    subprocess.run(["osascript", "-e", script])


def neofetch():
    script = '''
    tell application "iTerm"
        activate
        create window with default profile
        tell current session of current window
            write text "neofetch"
        end tell
    end tell
    '''
    subprocess.run(["osascript", "-e", script])

def cpu():
    cpu = psutil.cpu_percent()
    print(colored(f"Utilizzo della CPU: {cpu}%", "yellow"))
    speak(f"Utilizzo della CPU: {cpu}%")
    return(f"Utilizzo della CPU: {cpu}%")

def ram():
    ram = psutil.virtual_memory().percent
    print(colored(f"Utilizzo della RAM: {ram}%", "yellow"))
    speak(f"Utilizzo della RAM: {ram}%")
    return(f"Utilizzo della RAM: {ram}%")

def disk():
    for part in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(part.mountpoint)
        except PermissionError:
            # Saltare partizioni senza permessi
            continue
        print(f"Partizione: {part.device} montata in {part.mountpoint}")
        print(f"  Totale: {usage.total // (1024**3)} GB")
        print(f"  Usato:  {usage.used // (1024**3)} GB")
        print(f"  Libero: {usage.free // (1024**3)} GB")
        print(f"  Percentuale usata: {usage.percent}%\n")
        speak(f"partizione {part.device} montata in {part.mountpoint}, totale {usage.total // (1024**3)} GB, usato {usage.used // (1024**3)} GB, libero {usage.free // (1024**3)} GB, percentuale usata {usage.percent}%")
        return(f"partizione {part.device} montata in {part.mountpoint}, totale {usage.total // (1024**3)} GB, usato {usage.used // (1024**3)} GB, libero {usage.free // (1024**3)} GB, percentuale usata {usage.percent}%")


def battery():
    battery = psutil.sensors_battery()
    if battery:
        percent = battery.percent
        is_plugged = battery.power_plugged
        status = "in carica" if is_plugged else "non in carica"
        print(colored(f"Livello batteria: {percent}%, {status}", "yellow"))
        speak(f"Livello batteria: {percent}%, {status}")
        return(f"Livello batteria: {percent}%, {status}")
    else:
        print(colored("Nessun sensore di batteria trovato.", "red"))
        speak("Nessun sensore di batteria trovato.")
        return("Nessun sensore di batteria trovato.")

def random_psw():
    import random
    import string

    length = 12  # Lunghezza della password
    characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(random.choice(characters) for i in range(length))
    print(colored(f"La tua nuova password casuale è: {password}", "yellow"))
    speak(f"La tua nuova password casuale è: {password}")
    return(f"La tua nuova password casuale è: {password}")
    

def random_number():
    import random
    number = random.randint(1, 999)  # Genera un numero casuale tra 1 e 100
    print(colored(f"Il tuo numero casuale è: {number}", "yellow"))
    speak(f"Il tuo numero casuale è: {number}")
    return(f"Il tuo numero casuale è: {number}")

def audio_switch():
    with open("config.json", "r+") as f:
        config = json.load(f)
        config["audio"] = not config.get("audio", False)
        f.seek(0)
        json.dump(config, f, indent=4)
        f.truncate()

def mic_switch():
    with open("config.json", "r+") as f:
        config = json.load(f)
        config["mic"] = not config.get("mic", False)
        f.seek(0)
        json.dump(config, f, indent=4)
        f.truncate()

def sound_switch():
    with open("config.json", "r+") as f:
        config = json.load(f)

        # Inverti lo stato attuale (se mic o audio è attivo → disattiva entrambi)
        stato_attuale = config.get("mic", False) or config.get("audio", False)
        nuovo_valore = not stato_attuale

        config["mic"] = nuovo_valore
        config["audio"] = nuovo_valore

        f.seek(0)
        json.dump(config, f, indent=4)
        f.truncate()

def orario():
    ora_attuale = datetime.now()
    print(ora_attuale)
    speak(f"Sono le {ora_attuale.strftime('%H:%M')}")
    return f"Sono le {ora_attuale.strftime('%H:%M')}"

def search_wolfram(query: str) -> str:
    """Interroga WolframAlpha con la query dell'utente."""
    print(f"Wolfram query: {query}")
    url = "https://api.wolframalpha.com/v1/result"
    params = {"i": query, "appid": wolfram_appid}

    try:
        response = requests.get(url, params=params)
        if response.ok:
            print(f"Wolfram response: {response.text}")
            return response.text
        else:
            return "Non sono riuscito a ottenere una risposta da WolframAlpha."
    except Exception as e:
        return f"Errore durante la richiesta a WolframAlpha: {e}"
def show_events():
    try:
        response = requests.get("http://localhost:5173/api/calendar/today")
        data = response.json()
        if data.get("status") == "ok":
            events = data.get("events", [])
            if not events:
                return "Non hai eventi oggi."

            testo = "Ecco gli eventi di oggi:\n"
            for ev in events:
                start = ev['start'][11:16] if 'start' in ev and len(ev['start']) >= 16 else "??:??"
                end = ev['end'][11:16] if 'end' in ev and len(ev['end']) >= 16 else "??:??"
                testo += f"- {ev['summary']} dalle {start} alle {end}\n"

            return testo.strip()  # Rimuove l'ultima newline
        else:
            return "Non sono riuscito a recuperare gli eventi."
    except Exception as e:
        return f"Errore nel recupero eventi: {e}"


def scegli_calendario(calendari, nome="Personale"):
    """
    Trova un calendario per nome con ricerca più flessibile
    """
    print(f"Ricerca calendario: '{nome}'")
    print(f"Calendari disponibili: {[cal.name for cal in calendari]}")
    
    # Ricerca esatta
    for cal in calendari:
        if cal.name == nome:
            print(f"Calendario trovato: {cal.name}")
            return cal
    
    # Ricerca case-insensitive
    nome_lower = nome.lower()
    for cal in calendari:
        if cal.name.lower() == nome_lower:
            print(f"Calendario trovato (case-insensitive): {cal.name}")
            return cal
    
    # Ricerca parziale
    for cal in calendari:
        if nome_lower in cal.name.lower():
            print(f"Calendario trovato (ricerca parziale): {cal.name}")
            return cal
    
    print(f"Calendario '{nome}' non trovato")
    return None


def get_available_calendars(client=None):
    """
    Funzione helper per ottenere la lista dei calendari disponibili
    """
    try:
        if not client:
            client = DAVClient(
                url="https://caldav.icloud.com/",
                username=icloud_username,
                password=icloud_app_password
            )
        
        principal = client.principal()
        calendari = principal.calendars()
        
        calendar_list = []
        for cal in calendari:
            try:
                # Verifica che il calendario sia scrivibile
                calendar_list.append({
                    'name': cal.name,
                    'url': str(cal.url),
                    'writable': hasattr(cal, 'add_event')
                })
            except Exception as e:
                print(f"Errore nell'accesso al calendario {cal}: {e}")
                
        return calendar_list
    except Exception as e:
        print(f"Errore nel recupero calendari: {e}")
        return []


def handle_new_event(titolo, ora_inizio_str, durata_minuti, descrizione="", lista="Personale", location=""):
    """
    Crea un nuovo evento nel calendario specificato
    
    Args:
        titolo (str): Titolo dell'evento
        ora_inizio_str (str): Data/ora inizio formato "YYYY-MM-DD HH:MM"
        durata_minuti (int): Durata in minuti (default 60)
        descrizione (str): Descrizione dell'evento
        lista (str): Nome del calendario
        location (str): Luogo dell'evento
    
    Returns:
        str: Messaggio di conferma o errore
    """
    client = None
    try:
        # Connessione al server CalDAV
        client = DAVClient(
            url="https://caldav.icloud.com/",
            username=icloud_username,
            password=icloud_app_password
        )
        
        principal = client.principal()
        calendari = principal.calendars()
        
        # Debug: mostra calendari disponibili
        print("=== CALENDARI DISPONIBILI ===")
        for i, cal in enumerate(calendari):
            try:
                print(f"{i+1}. Nome: '{cal.name}' - URL: {cal.url}")
            except Exception as e:
                print(f"Errore nell'accesso al calendario {i+1}: {e}")
        
        # Trova il calendario
        calendar = scegli_calendario(calendari, lista)
        if not calendar:
            available_calendars = [cal.name for cal in calendari if hasattr(cal, 'name')]
            return f"❌ Calendario '{lista}' non trovato.\nCalendari disponibili: {', '.join(available_calendars)}"

        # Parsing e conversione dell'orario
        locale_tz = pytz_timezone("Europe/Rome")
        
        try:
            start_naive = datetime.strptime(ora_inizio_str, "%Y-%m-%d %H:%M")
        except ValueError:
            # Prova formati alternativi
            date_formats = [
                "%d/%m/%Y %H:%M",
                "%d-%m-%Y %H:%M",
                "%Y/%m/%d %H:%M"
            ]
            start_naive = None
            for fmt in date_formats:
                try:
                    start_naive = datetime.strptime(ora_inizio_str, fmt)
                    break
                except ValueError:
                    continue
            
            if not start_naive:
                return f"❌ Formato data non valido: '{ora_inizio_str}'. Usa: YYYY-MM-DD HH:MM"
        if not durata_minuti:
            durata_minuti = 60
        start_local = locale_tz.localize(start_naive)
        start_utc = start_local.astimezone(UTC)
        end_local = start_local + timedelta(minutes=int(durata_minuti))
        end_utc = end_local.astimezone(UTC)
        
        # Creazione dell'evento iCalendar
        cal = Calendar()
        cal.add('prodid', '-//My Calendar//mxm.dk//')
        cal.add('version', '2.0')
        
        event = Event()
        event.add('summary', titolo)
        event.add('dtstart', start_utc)
        event.add('dtend', end_utc)
        event.add('dtstamp', datetime.now(UTC))
        event.add('uid', str(uuid.uuid4()))
        
        if descrizione:
            event.add('description', descrizione)
        
        # FIX: La location va aggiunta all'evento, non al calendario!
        if location:
            event.add('location', location)
        
        cal.add_component(event)

        # Salvataggio dell'evento
        try:
            calendar.add_event(cal.to_ical())
            print(f"Evento creato con successo: {titolo}")
            return f"✅ Evento '{titolo}' creato nel calendario '{calendar.name}'."
        except Exception as save_error:
            print(f"Errore nel salvataggio: {save_error}")
            return f"❌ Errore nel salvataggio dell'evento: {str(save_error)}"

    except Exception as e:
        print(f"Errore generale: {e}")
        return f"❌ Errore durante la creazione dell'evento: {str(e)}"


def list_calendars_info():
    """
    Funzione di debug per visualizzare informazioni sui calendari
    """
    try:
        client = DAVClient(
            url="https://caldav.icloud.com/",
            username=icloud_username,
            password=icloud_app_password
        )
        
        principal = client.principal()
        calendari = principal.calendars()
        
        print("\n=== INFORMAZIONI CALENDARI ===")
        for i, cal in enumerate(calendari, 1):
            try:
                print(f"{i}. Nome: '{cal.name}'")
                print(f"   URL: {cal.url}")
                print(f"   Tipo: {type(cal)}")
                # Verifica proprietà
                props = cal.get_properties(['{DAV:}displayname', '{urn:ietf:params:xml:ns:caldav}calendar-description'])
                print(f"   Proprietà: {props}")
                print("   ---")
            except Exception as e:
                print(f"{i}. Errore nell'accesso al calendario: {e}")
                print("   ---")
                
    except Exception as e:
        print(f"Errore nella connessione: {e}")

def delete_event(summary, date=None):
    """
    Cancella un evento dal calendario iCloud.
    
    Args:
        summary (str): Nome/titolo dell'evento da cancellare
        date (str, optional): Data in formato YYYY-MM-DD. Se None, usa oggi
        icloud_username (str): Email iCloud
        icloud_password (str): Password app specifica iCloud
    
    Returns:
        str: Messaggio di risultato
    """
    if not icloud_username or not icloud_app_password:
        return "❌ Credenziali iCloud mancanti"
    
    try:
        # Connessione CalDAV
        client = DAVClient(
            url='https://caldav.icloud.com',
            username=icloud_username,
            password=icloud_app_password,
        )
        principal = client.principal()
        calendars = principal.calendars()
        
        if not calendars:
            return "❌ Nessun calendario trovato"
        
        # Gestione data target
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d")
            except ValueError:
                return "❌ Formato data non valido. Usa YYYY-MM-DD"
        else:
            target_date = datetime.now()
        
        # STEP 1: Cercare l'evento per nome in tutti i calendari
        for calendar in calendars:
            try:
                # Ottieni tutti gli eventi del calendario
                all_events = calendar.events()
                
                for event_wrapper in all_events:
                    try:
                        cal = Calendar.from_ical(event_wrapper.data)
                        
                        for component in cal.walk('VEVENT'):
                            event_summary = component.get('SUMMARY')
                            
                            # STEP 2: Controlla se il nome corrisponde esattamente
                            if event_summary and summary.lower() == str(event_summary).lower():
                                print(f"✅ Evento trovato: '{event_summary}' nel calendario '{calendar.name}'")
                                
                                # STEP 3: Debug completo dell'evento
                                print(f"🔍 Debug evento '{event_summary}':")
                                for prop_name, prop_value in component.property_items():
                                    print(f"  {prop_name}: {prop_value}")
                                
                                # Controlla se si ripete
                                rrule = component.get("RRULE")
                                recurrence_id = component.get("RECURRENCE-ID")
                                
                                print(f"🔍 RRULE trovato: {rrule}")
                                print(f"🔍 RECURRENCE-ID trovato: {recurrence_id}")
                                
                                if rrule or recurrence_id:
                                    print(f"🔁 Evento ricorrente rilevato")
                                    # Aggiungi EXDATE
                                    return _add_exdate(event_wrapper, component, target_date, str(event_summary))
                                else:
                                    print("📝 Evento singolo rilevato")
                                    # Elimina normalmente
                                    event_wrapper.delete()
                                    return f"✅ Eliminato evento singolo '{event_summary}'"
                                        
                    except Exception as e:
                        print(f"⚠️ Errore parsing evento: {e}")
                        continue
                        
            except Exception as e:
                print(f"⚠️ Errore accesso calendario '{calendar.name}': {e}")
                continue
        
        return f"❌ Evento '{summary}' non trovato in nessun calendario"
        
    except Exception as e:
        return f"❌ Errore: {str(e)}"

def _add_exdate(event_wrapper, component, target_date, event_title):
    """
    Aggiunge EXDATE per escludere una data specifica da un evento ricorrente
    """
    try:
        print(f"🎯 Aggiungendo EXDATE per la data: {target_date.strftime('%Y-%m-%d')}")
        
        # Ottieni l'ora di inizio dell'evento
        dtstart = component.get("DTSTART")
        if not dtstart:
            return "❌ Impossibile determinare l'ora di inizio"
        
        start_time = dtstart.dt
        print(f"⏰ Ora inizio evento: {start_time}")
        
        # Crea il datetime da escludere mantenendo l'ora originale
        if isinstance(start_time, datetime):
            excluded_datetime = datetime.combine(
                target_date.date(), 
                start_time.time()
            )
            if start_time.tzinfo:
                excluded_datetime = excluded_datetime.replace(tzinfo=start_time.tzinfo)
        else:
            excluded_datetime = target_date.date()
        
        print(f"❌ Datetime da escludere: {excluded_datetime}")
        
        # Ricarica il calendario per modificarlo
        cal = Calendar.from_ical(event_wrapper.data)
        vevent = None
        
        for comp in cal.walk('VEVENT'):
            if str(comp.get('SUMMARY', '')).lower() == event_title.lower():
                vevent = comp
                break
        
        if not vevent:
            return "❌ Evento non trovato per la modifica"
        
        # Gestisci EXDATE esistenti
        existing_exdates = vevent.get("EXDATE")
        
        if existing_exdates:
            print(f"📋 EXDATE esistenti trovati: {existing_exdates}")
            
            # Raccogli tutte le date già escluse
            excluded_dates = []
            
            # Se existing_exdates è una lista di oggetti EXDATE
            if isinstance(existing_exdates, list):
                for exdate_obj in existing_exdates:
                    if hasattr(exdate_obj, 'dts'):
                        excluded_dates.extend(exdate_obj.dts)
                    else:
                        excluded_dates.append(exdate_obj)
            else:
                # Singolo oggetto EXDATE
                if hasattr(existing_exdates, 'dts'):
                    excluded_dates.extend(existing_exdates.dts)
                else:
                    excluded_dates.append(existing_exdates)
            
            # Aggiungi la nuova data
            excluded_dates.append(excluded_datetime)
            
            # Rimuovi tutti gli EXDATE esistenti
            while vevent.get("EXDATE"):
                vevent.pop("EXDATE")
            
            # Aggiungi tutte le date escluse come singoli EXDATE
            for date_to_exclude in excluded_dates:
                if hasattr(date_to_exclude, 'dt'):
                    vevent.add("EXDATE", date_to_exclude.dt)
                else:
                    vevent.add("EXDATE", date_to_exclude)
            
            print(f"✅ Aggiornati EXDATE con {len(excluded_dates)} date escluse")
        else:
            # Primo EXDATE
            vevent.add("EXDATE", excluded_datetime)
            print(f"✅ Primo EXDATE aggiunto: {excluded_datetime}")
        
        # Salva
        event_wrapper.data = cal.to_ical()
        event_wrapper.save()
        
        return f"✅ Esclusa istanza del {excluded_datetime} dall'evento ricorrente '{event_title}'"
        
    except Exception as e:
        return f"❌ Errore aggiunta EXDATE: {str(e)}"

def s_playpause():
    run_applescript('tell application "Spotify" to playpause')
    
def s_next():
    run_applescript('tell application "Spotify" to next track')

def s_previous():
    run_applescript('tell application "Spotify" to previous track')
    
def s_current():
    track_script = '''
        tell application "Spotify"
            set trackName to name of current track
            set artistName to artist of current track
            set albumName to album of current track
            return trackName & "|" & artistName & "|" & albumName
        end tell
        '''
    result = subprocess.run(
        ["osascript", "-e", track_script],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        track_info = result.stdout.strip()
        if track_info:
            track_name, artist_name, album_name = track_info.split("|")
            response = f"Sto riproducendo '{track_name}' di {artist_name} dall'album '{album_name}'."
        else:
            response = "Non sto riproducendo nessuna musica al momento."
            
    speak(response)
    return response


def internet_search(query):
    url = f'https://serpapi.com/search.json?q={query}&api_key={SERPAPI_API_KEY}'
    response = requests.get(url)
    results = response.json()
    search_results = []
    if 'organic_results' in results:
        for item in results['organic_results']:
            search_results.append(f"{item['title']}: {item['link']}")
    return search_results

def google_search(query):
    url = f'https://google.com/search?q={query}'
    webbrowser.open(url)
    
def open_google_maps(query):
    url = f'https://www.google.com/maps/search/?api=1&query={query}'
    webbrowser.open(url)


def new_txt_file(file_name="nuovo_file", content=""):
    user_path = os.path.expanduser("~")
    file_path = os.path.join(user_path, "Desktop", f"{file_name}.txt")
    try:
        with open(file_path, 'w') as f:
            f.write(content)
        return f"Ho creato il file {file_name}.txt sul tuo desktop."
    except Exception as e:
        return f"❌ Errore creazione file: {str(e)}"
    
def get_video_id(video_url):
    """
    Estrae l'ID del video da un URL di YouTube in modo più affidabile.
    
    Args:
        video_url (str): L'URL completo del video di YouTube.
        
    Returns:
        str: L'ID del video, o None se non è valido.
    """
    try:
        parsed_url = urlparse(video_url)
        if parsed_url.hostname in ['www.youtube.com', 'youtube.com']:
            # Gestisce gli URL del tipo https://www.youtube.com/watch?v=...
            query_params = parse_qs(parsed_url.query)
            print(f"Query params id: {query_params}") 
            return query_params.get('v', [None])[0]
        elif parsed_url.hostname == 'youtu.be':
            # Gestisce gli URL del tipo https://youtu.be/...
            print(f"Query params id: {parsed_url.path[1:]}") 
            return parsed_url.path[1:]
    except Exception:
        return None
    return None

def summarize_youtube_video(video_url: str) -> str:
    """
    Estrae la trascrizione di un video di YouTube e la riassume usando l'IA di Groq.
    
    Args:
        video_url (str): L'URL del video di YouTube.
        
    Returns:
        str: Il riassunto del video, o un messaggio di errore.
    """
    video_id = get_video_id(video_url)
    if not video_id:
        return "❌ Errore: URL di YouTube non valido."

    try:
        client = Groq(api_key=groq_api_key)
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.fetch(video_id, languages=['it', 'en'])
        
        # --- CORREZIONE QUI ---
        # Accedi all'attributo 'text' dell'oggetto, non alla chiave di un dizionario.
        transcript_text = " ".join([t.text for t in transcript_list])
        print(f"Transcript del video: {transcript_text[:100]}...")  # Mostra solo i primi 100 caratteri per debug
        
        if len(transcript_text) < 100:
            return "❌ Il video non ha una trascrizione sufficientemente lunga per essere riassunta."

        messages = [
            {"role": "system", "content": "Sei un assistente che riassume video in modo conciso in italiano."},
            {"role": "user", "content": f"Riassumi il seguente testo del video:\n\n{transcript_text}"}
        ]
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=500
        )
        
        summary = chat_completion.choices[0].message.content.strip()
        print(f"Riassunto: {summary[:100]}...")

        return summary
    except NoTranscriptFound:
        return "❌ Il video non ha una trascrizione disponibile in italiano o inglese."
    except TranscriptsDisabled:
        return "❌ La trascrizione è disabilitata per questo video."
    except VideoUnavailable:
        return "❌ Il video non è disponibile o non esiste."
    except Exception as e:
        return f"❌ Si è verificato un errore durante il riepilogo del video: {e}"

def video_summary(video_url: str) -> str:
    """
    Funzione principale che gestisce il comando di riassunto.
    """
    try:
        summary = summarize_youtube_video(video_url)
        
        # Invia il riassunto all'endpoint del server Flask.
        # Assicurati che il tuo server Flask sia in ascolto sulla porta 5100.
        response = requests.post("http://localhost:5100/api/summary", json={"summary": summary})
        
        if response.status_code == 200:
            return "✅ Sto riassumendo il video. Il riassunto apparirà a breve nel widget."
        else:
            return f"❌ Errore durante l'invio del riassunto al server: {response.text}"
            
    except Exception as e:
        return f"❌ Errore critico durante l'esecuzione del comando: {e}"

def wikipedia_summary(query):
    url = f"https://it.wikipedia.org/api/rest_v1/page/summary/{query.replace(' ', '_')}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data.get("extract", "Nessun riassunto trovato.")
    return "Errore durante la richiesta a Wikipedia."

def start_timer(name, seconds):
    """Avvia un timer con un nome e durata in secondi."""
    try:
        response = requests.post(
            "http://127.0.0.1:5100/api/timers",
            json={"name": name, "seconds": int(seconds)}
        )
        return response.json().get("message", "Errore nell'avvio del timer.")
    except Exception as e:
        return f"Errore: {e}"

def cancel_timer(name):
    """Cancella un timer dato il nome."""
    try:
        response = requests.delete(f"http://127.0.0.1:5100/api/timers/{name}")
        return response.json().get("message", "Errore nella cancellazione del timer.")
    except Exception as e:
        return f"Errore: {e}"

def list_timers():
    """Mostra i timer attivi e i secondi rimanenti."""
    try:
        response = requests.get("http://127.0.0.1:5100/api/timers")
        data = response.json()
        if not data:
            return "Nessun timer attivo."
        result = []
        for name, remaining in data.items():
            result.append(f"{name}: {remaining} secondi rimanenti")
        return "\n".join(result)
    except Exception as e:
        return f"Errore: {e}"