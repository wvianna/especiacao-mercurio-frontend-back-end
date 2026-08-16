#ifndef ACTUATOR_DRIVER_H
#define ACTUATOR_DRIVER_H

#include "pin_map.h"
#include <json_protocol.h>

class ActuatorDriver {
 public:
  void apply(const Command& cmd);
  void shutdown();
};

#endif  // ACTUATOR_DRIVER_H
