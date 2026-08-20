#ifndef ACTUATOR_DRIVER_H
#define ACTUATOR_DRIVER_H

#include "pin_map.h"
#include <json_protocol.h>
#include <pump_toggle.h>

class ActuatorDriver {
 public:
  void apply(const Command& cmd);
  void update();  // avança o pulso de toggle da bomba (chamar a cada loop)
  void shutdown();

 private:
  PumpToggle pump_;  // bomba peristáltica: acionamento por pulso (toggle)
};

#endif  // ACTUATOR_DRIVER_H
