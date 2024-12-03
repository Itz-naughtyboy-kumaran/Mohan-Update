from __future__ import print_function
from dronekit import VehicleMode, connect, LocationGlobalRelative, Command
from pymavlink import mavutil
import time


class droneCtrl:
    
    flightModes = {
        'MODE_STABILIZE': 'STABILIZE',
        'MODE_ACRO': 'ACRO',
        'MODE_ALTHOLD': 'ALT_HOLD',
        'MODE_AUTO': 'AUTO',
        'MODE_GUIDED': 'GUIDED',
        'MODE_LOITER': 'LOITER',
        'MODE_RTL': 'RTL',
        'MODE_CIRCLE': 'CIRCLE',
        'MODE_POSITION': 'POSITION',
        'MODE_LAND': 'LAND',
        'MODE_OF_LOITER': 'OF_LOITER',
        'MODE_DRIFT': 'DRIFT',
        'MODE_SPORT': 'SPORT',
        'MODE_FLIP': 'FLIP',
        'MODE_AUTOTUNE': 'AUTOTUNE',
        'MODE_POSHOLD': 'POSHOLD',
        'MODE_BRAKE': 'BRAKE',
        'MODE_THROW': 'THROW',
        'MODE_AVOID_ADSB': 'AVOID_ADSB',
        'MODE_GUIDED_NOGPS': 'GUIDED_NOGPS',
        'MODE_SMART_RTL': 'SMART_RTL',
        'MODE_FLOWHOLD': 'FLOWHOLD',
        'MODE_FOLLOW': 'FOLLOW',
        'MODE_ZIGZAG': 'ZIGZAG',
        'MODE_SYSTEMID': 'SYSTEMID',
        'MODE_AUTOROTATE': 'AUTOROTATE',
        'MODE_AUTO_RTL': 'AUTO_RTL'
    }   


    def __init__(self, Uri=None):
        
        self.connectUri = Uri
        self.vehicle = None
        self.baseMode = droneCtrl.flightModes['MODE_STABILIZE']
        self.currentMode = self.baseMode
        self.isArmed = False
        self.Arm = False
        self.Disarm = False
        self.cmds = None
        if(self.connectUri != None):
            self.connectDrone(connectUri=self.connectUri)

    def connectDrone(self,connectUri):
        self.connectUri = connectUri
        self.vehicle = connect(self.connectUri,wait_ready=False,baud=57600)
        print(f'Vehicle Connected to {self.connectUri}')

    def armDrone(self):
        """while not self.vehicle.is_armable:
            print("Waiting for the drone to be ready")
            time.sleep(1)
        """
        self.Arm = True
        self.vehicle.armed = self.Arm
        print(f'Vechile Armed in {self.currentMode}')
        self.isArmed = True

    def disarmDrone(self):
        self.Disarm = True
        self.vehicle.armed = False
        self.Arm = self.isArmed = not self.Disarm

        print("Vehicle Disarmed")

    def takeoff(self,takeoffAlt):
        if(self.currentMode != droneCtrl.flightModes["MODE_GUIDED"]):
            print(f'WARNING: Takeoff only Permitted in {droneCtrl.flightModes["MODE_GUIDED"]}')
        else:
            self.vehicle.simple_takeoff(takeoffAlt)
            while True:
                print(" Altitude: ", self.vehicle.location.global_relative_frame.alt)
                if self.vehicle.location.global_relative_frame.alt >= takeoffAlt * 0.95:
                    print("Reached target altitude")
                break
            time.sleep(1)
            
    def changeMode(self,mode):
        if mode in droneCtrl.flightModes.values():
            self.vehicle.mode = VehicleMode(mode)
            time.sleep(1)
            self.currentMode = mode
            print(f'Vehicle mode changed to {self.currentMode}')
        else:
            print(f'WARNING: No mode names {mode} present in available modes', droneCtrl.flightModes.values())

    def gotoPoint(self,location,airspeed=4,groundspeed=4):
        location = LocationGlobalRelative(location.lat,location.lon,location.alt)
        if(self.currentMode != droneCtrl.flightModes['MODE_GUIDED']):
            print("Changing the Vechile mode to GUIDED")
            time.sleep(1)
            self.changeMode(droneCtrl.flightModes['MODE_GUIDED'])
        self.vehicle.simple_goto(location=location,airspeed=airspeed,groundspeed=groundspeed)
        while True:
            distance = location.dist(self.vehicle.location.global_frame)
            if distance < 1:
                print(f"Reached {location}")
                break
            time.sleep(2)

    def gotoPoints(self,locations=[],airspeed=4,groundspeed=4):
        
        
        cmds = self.vehicle.commands
        cmds.clear()
        for location in locations:
            print(location['lat'])
            cmd = Command(0,0,0,mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT, mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,0,0,0,0,0,0,location['lat'],location['lon'],location['alt'])
            cmds.add(cmd)
        
        cmds.upload()
        

        
        self.vehicle.commands.next = 0
        self.changeMode("AUTO")

        while True:
            nextwaypoint = self.vehicle.commands.next
            if nextwaypoint == len(locations):
                break
            time.sleep(2)
            
    def getLocationGlobal(self):
        return self.vehicle.location.global_frame
    def areaServey(self):
        #for future 
        pass

    def calbrateLevel(self):
        print("Calibrating level...")
    # Send the level calibration command
        print("Performing level calibration...")
        msg = self.vehicle.message_factory.command_long_encode(
        0, 0,    # target_system, target_component
        241,     # MAV_CMD_PREFLIGHT_CALIBRATION
        0,       # confirmation
        0,       # Param 1: Gyro calibration (0 to skip)
        0,       # Param 2: Magnetometer calibration (0 to skip)
        1,       # Param 3: Level calibration (1 to perform)
        0,       # Param 4: RC calibration (0 to skip)
        0,       # Param 5: Accelerometer temperature calibration (0 to skip)
        0,       # Param 6: Airspeed calibration (0 to skip)
        0        # Param 7: Reserved
        )
    # Send the command to the vehicle
        self.vehicle.send_mavlink(msg)
        self.vehicle.flush()
        print("Level calibration command sent.")
        return True