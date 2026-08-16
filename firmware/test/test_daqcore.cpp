#include <unity.h>
#include <string.h>
#include <json_protocol.h>
#include <watchdog.h>

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
  return UNITY_END();
}
