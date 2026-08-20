#include <unity.h>
#include <string.h>
#include <json_protocol.h>
#include <watchdog.h>
#include <pump_toggle.h>

// ---------------------------------------------------------------------------
// parseIncoming
// ---------------------------------------------------------------------------

void test_parse_write_packet(void) {
  Command cmd = {0, 0, 0, 0, 0, 0, 0, 0, false, false};
  const char* json =
      "{\"valves\":{\"sv1\":1,\"sv2\":0,\"sv3\":0,\"sv4\":0,\"sv5\":1},"
      "\"pump\":1,\"pwm\":{\"u\":128,\"f2\":255}}";
  TEST_ASSERT_TRUE(parseIncoming(json, cmd));
  TEST_ASSERT_TRUE(cmd.valid);
  TEST_ASSERT_FALSE(cmd.is_config);
  TEST_ASSERT_EQUAL_UINT8(1, cmd.sv1);
  TEST_ASSERT_EQUAL_UINT8(0, cmd.sv2);
  TEST_ASSERT_EQUAL_UINT8(1, cmd.sv5);
  TEST_ASSERT_EQUAL_UINT8(1, cmd.pump);
  TEST_ASSERT_EQUAL_UINT8(128, cmd.pwm_u);
  TEST_ASSERT_EQUAL_UINT8(255, cmd.pwm_f2);
}

void test_parse_config_handshake(void) {
  Command cmd = {0, 0, 0, 0, 0, 0, 0, 0, false, false};
  const char* json =
      "{\"cmd\":\"config\",\"pid_u\":{\"kp\":5.0,\"ti\":1.8,\"td\":0.0},"
      "\"pid_f2\":{\"kp\":44.67,\"ti\":0.18,\"td\":0.0}}";
  TEST_ASSERT_TRUE(parseIncoming(json, cmd));
  TEST_ASSERT_TRUE(cmd.is_config);
  TEST_ASSERT_FALSE(cmd.valid);  // config não altera atuadores
}

void test_parse_invalid_json(void) {
  Command cmd;
  TEST_ASSERT_FALSE(parseIncoming("{invalid", cmd));
  TEST_ASSERT_FALSE(parseIncoming("", cmd));
  TEST_ASSERT_FALSE(parseIncoming("{\"foo\":1}", cmd));  // sem valves/pwm
}

void test_pwm_saturation(void) {
  Command cmd;
  const char* json =
      "{\"valves\":{\"sv1\":1},\"pump\":0,\"pwm\":{\"u\":999,\"f2\":-5}}";
  TEST_ASSERT_TRUE(parseIncoming(json, cmd));
  TEST_ASSERT_EQUAL_UINT8(255, cmd.pwm_u);
  TEST_ASSERT_EQUAL_UINT8(0, cmd.pwm_f2);
}

void test_build_report(void) {
  Report rep = {-45.2f, 699.5f, "active", 0};
  char out[128];
  buildReport(rep, out, sizeof(out));
  TEST_ASSERT_NOT_NULL(strstr(out, "\"t1\":-45.2"));
  TEST_ASSERT_NOT_NULL(strstr(out, "\"t2\":699.5"));
  TEST_ASSERT_NOT_NULL(strstr(out, "\"status\":\"active\""));
  TEST_ASSERT_NOT_NULL(strstr(out, "\"error_code\":0"));
}

// ---------------------------------------------------------------------------
// Watchdog
// ---------------------------------------------------------------------------

static uint32_t fake_now = 0;
static uint32_t fake_now_fn() { return fake_now; }

void test_watchdog_not_tripped_before_timeout(void) {
  Watchdog wd(1000);
  wd.setNow(fake_now_fn);
  fake_now = 100;
  wd.feed();
  fake_now = 1099;
  TEST_ASSERT_FALSE(wd.tripped());
}

void test_watchdog_trips_after_timeout(void) {
  Watchdog wd(1000);
  wd.setNow(fake_now_fn);
  fake_now = 100;
  wd.feed();
  fake_now = 1101;  // > 1000 ms após o feed
  TEST_ASSERT_TRUE(wd.tripped());
}

void test_watchdog_resets_on_feed(void) {
  Watchdog wd(1000);
  wd.setNow(fake_now_fn);
  fake_now = 100;
  wd.feed();
  fake_now = 1500;
  TEST_ASSERT_TRUE(wd.tripped());
  fake_now = 1600;
  wd.feed();
  fake_now = 2599;
  TEST_ASSERT_FALSE(wd.tripped());
}

void test_watchdog_timeout_configurable(void) {
  Watchdog wd(500);
  wd.setNow(fake_now_fn);
  fake_now = 0;
  wd.feed();
  fake_now = 501;
  TEST_ASSERT_TRUE(wd.tripped());
}

// ---------------------------------------------------------------------------
// PumpToggle (bomba peristáltica — acionamento por pulso)
// ---------------------------------------------------------------------------

void test_pump_toggle_pulses_on_on_transition(void) {
  PumpToggle pump(600);
  pump.setNow(fake_now_fn);
  fake_now = 100;
  // OFF -> ON: deve iniciar o pulso
  TEST_ASSERT_TRUE(pump.update(true));
  TEST_ASSERT_TRUE(pump.pulsing());
  // Sem transição, ainda dentro da janela: pulso continua
  fake_now = 500;
  TEST_ASSERT_FALSE(pump.update(true));
  TEST_ASSERT_TRUE(pump.pulsing());
}

void test_pump_toggle_ends_pulse_after_timeout(void) {
  PumpToggle pump(600);
  pump.setNow(fake_now_fn);
  fake_now = 0;
  pump.update(true);  // inicia o pulso
  fake_now = 599;
  pump.update(true);
  TEST_ASSERT_TRUE(pump.pulsing());
  fake_now = 601;
  pump.update(true);
  TEST_ASSERT_FALSE(pump.pulsing());  // pulso concluído (toggle ligado)
}

void test_pump_toggle_pulses_on_off_transition(void) {
  PumpToggle pump(600);
  pump.setNow(fake_now_fn);
  fake_now = 0;
  pump.update(true);
  fake_now = 600;
  pump.update(true);
  TEST_ASSERT_FALSE(pump.pulsing());
  // ON -> OFF: novo pulso de toggle (desligar)
  fake_now = 700;
  TEST_ASSERT_TRUE(pump.update(false));
  TEST_ASSERT_TRUE(pump.pulsing());
  TEST_ASSERT_FALSE(pump.desired());
}

void test_pump_toggle_restarts_pulse_on_rapid_transition(void) {
  PumpToggle pump(600);
  pump.setNow(fake_now_fn);
  fake_now = 0;
  pump.update(true);
  // Nova transição antes de terminar: reinicia o pulso
  fake_now = 300;
  TEST_ASSERT_TRUE(pump.update(false));
  TEST_ASSERT_TRUE(pump.pulsing());
  fake_now = 899;  // 599 ms após o reinício
  pump.update(false);
  TEST_ASSERT_TRUE(pump.pulsing());
  fake_now = 901;
  pump.update(false);
  TEST_ASSERT_FALSE(pump.pulsing());
}

void test_pump_toggle_reset(void) {
  PumpToggle pump(600);
  pump.setNow(fake_now_fn);
  fake_now = 0;
  pump.update(true);
  TEST_ASSERT_TRUE(pump.pulsing());
  pump.reset();
  TEST_ASSERT_FALSE(pump.pulsing());
  TEST_ASSERT_FALSE(pump.desired());
  // Após reset, nova transição gera novo pulso
  fake_now = 50;
  TEST_ASSERT_TRUE(pump.update(true));
  TEST_ASSERT_TRUE(pump.pulsing());
}

int main(int argc, char** argv) {
  (void)argc;
  (void)argv;
  UNITY_BEGIN();
  RUN_TEST(test_parse_write_packet);
  RUN_TEST(test_parse_config_handshake);
  RUN_TEST(test_parse_invalid_json);
  RUN_TEST(test_pwm_saturation);
  RUN_TEST(test_build_report);
  RUN_TEST(test_watchdog_not_tripped_before_timeout);
  RUN_TEST(test_watchdog_trips_after_timeout);
  RUN_TEST(test_watchdog_resets_on_feed);
  RUN_TEST(test_watchdog_timeout_configurable);
  RUN_TEST(test_pump_toggle_pulses_on_on_transition);
  RUN_TEST(test_pump_toggle_ends_pulse_after_timeout);
  RUN_TEST(test_pump_toggle_pulses_on_off_transition);
  RUN_TEST(test_pump_toggle_restarts_pulse_on_rapid_transition);
  RUN_TEST(test_pump_toggle_reset);
  return UNITY_END();
}
