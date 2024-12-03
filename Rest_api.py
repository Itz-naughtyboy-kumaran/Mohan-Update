from DroneUtil.DroneCtrl import droneCtrl
from flask import Flask, request, jsonify
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
global drone

@app.route('/connect',methods=['POST'])
def connectDrone():
    global drone
    data = request.get_json()
    Uri = data['URI']
    print(f"URL = {Uri}")
    drone = droneCtrl(Uri)
    if drone.vehicle != None:
        print(f'Vehicle from port {Uri} connected')
    else:
        print("Vehicle Not connected")
    location = drone.getLocationGlobal()
    return jsonify({'location':{'lat':location.lat,'lon': location.lon}}), 200
@app.route('/ping',methods=['GET'])
def ping():
    pass

@app.route('/arm', methods=['POST'])
def arm():
    global drone
    try:
        drone.armDrone()
        success = True
        message="Armed"
    except Exception as e:
        success= False
        message= str(e)
    return jsonify({"message": message,'success':success}),200

@app.route('/takeoff', methods=['POST'])
def takeoff():
    global drone
    data = request.get_json()
    altitude = data['altitude']
    drone.changeMode('GUIDED')
    drone.takeoff(altitude)
    return jsonify({"message": "Taking off"}), 200

@app.route('/land', methods=['POST'])
def land():
    global drone
    drone.changeMode('LAND')
    return jsonify({"message": "Landing the drone"}), 200

@app.route('/set_mode', methods=['POST'])
def set_mode():
    global drone
    mode = request.json.get('mode')
    # Simulate setting the mode in the drone system
    # Replace with the actual command to set the mode in your drone
    # Simulate a successful respons
    drone.changeMode(mode)
    return jsonify({"success": True, "message": f"Flight mode set to {mode}."})

@app.route('/rtl', methods=['POST'])
def rtl():
    global drone
    # Change mode to RTL specifically
    drone.changeMode(droneCtrl.flightModes['MODE_RTL'])
    return jsonify({"message": "Returning to launch (RTL)"}), 200


@app.route('/getmode', methods=['GET'])
def getmode():
    print("Function name: getmode")
    print("Got the request")
    # Placeholder mode
    current_mode = "GUIDED"
    return jsonify({"mode": current_mode}), 200

@app.route('/getlocation', methods=['GET'])
def getlocation():
    
    return jsonify(location), 200

@app.route('/markers', methods=['POST'])
def mission():
    global drone
    data = request.get_json()
    print(data['markerList'])
    drone.gotoPoints(locations=data['markerList'])
    #waypoint = data['waypoint']
    return jsonify({"message": "Waypoint added"}), 200

@app.route('/disarm', methods=['POST'])
def disarm():
    global drone
    try:
       drone.disarmDrone()
       success=True
       message="Disarmed"
    except Exception as e:
       success=False
       message=str(e)
    return jsonify({"message": message,"success":success}), 200

@app.route('/sprey',methods=['POST'])
def sprey():
    #global drone
    data = request.get_json()
    drone.gotoPoints(data['locations'])
    return jsonify({"message": "sprey"}), 200

@app.route('/calib',methods=['GET','POST'])
def calib():
    global drone
    flag = drone.calbrateLevel()
    if flag:
        return jsonify({"message": "success"}),200
    else:
        return jsonify({"message": "fail"}),400


if __name__ == '__main__':
    app.run('0.0.0.0',debug=False)