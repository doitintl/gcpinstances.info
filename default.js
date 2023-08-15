"use strict";

var instances_data = [];
var loaded_data = {};
var g_app_initialized = false;
var g_data_table = null;
var g_settings = {};

var g_settings_defaults = {
  cost_duration: "hourly",
  region: "us-central1",
  reserved_term: "cud-1y",
  min_memory: 0,
  min_vcpus: 0,
  min_storage: 0,
  selected: "",
  compare_on: false,
  currency: "USD",
  symbol: "$",
  price: "1",
};

function init_data_table() {
  // create a second header row
  $("#data thead tr").clone(true).appendTo("#data thead");
  // add a text input filter to each column of the new row
  $("#data thead tr:eq(1) th").each(function (i) {
    var title = $(this).text();
    $(this).html(
      "<input type='text' class='column-filter' placeholder='Search... '" +
        title +
        "' />"
    );
    $("input", this).on("keyup change", function () {
      if (g_data_table.column(i).search() !== this.value) {
        g_data_table.column(i).search(this.value).draw();
      }
    });

    $('#table-search-box').keyup(function() {
      g_data_table.search($(this).val()).draw();
    });
  });
  g_data_table = $("#data").DataTable({
    data: instances_data,
    rowId: 0,
    bPaginate: false,
    bInfo: false,
    bStateSave: true,
    orderCellsTop: true,
    // searching: true,
    oSearch: {
      bRegex: true,
      bSmart: false,
    },
    columns: [
      null,
      null,
      { className: "numeric" },
      null,
      { className: "numeric" },
      null,
      null,
      null,
      null,
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
      { className: "numeric" },
    ],
    aoColumnDefs: [
      {
        // The columns below are sorted according to the sort attr of the <span> tag within their data cells
        aTargets: [
          "memory",
          "vcpus",
          "lnondemand",
          "lnsudc",
          "lnpc",
          "ln1cud",
          "ln3cud",
          "wnondemand",
          "wnsudc",
          "wnpc",
          "wn1cud",
          "wn3cud",
          "network",
        ],
        sType: "cust-sort",
      },
      {
        // The columns below are hidden by default
        aTargets: [
          "ssdsupport",
          "network",
          "gpu",
          "tenant",
          "virtualization",
          "benchmark",
          "lnondemand",
          "lnpc",
          "ln3cud",
          "wnondemand",
          "wnpc",
          "wn3cud",
          "cputype",
        ],
        bVisible: false,
      },
    ],
    // default sort by linux cost
    aaSorting: [[10, "asc"]],
    initComplete: function () {
      // fire event in separate context so that calls to get_data_table()
      // receive the cached object.
      setTimeout(function () {
        on_data_table_initialized();
      }, 0);
    },
    drawCallback: function () {
      // abort if initialization hasn't finished yet (initial draw)
      if (g_data_table === null) {
        return;
      }

      // Whenever the table is drawn, update the costs. This is necessary
      // because the cost duration may have changed while a filter was being
      // used and so some rows will need updating.
      redraw_costs();
    },
    // Store filtering, sorting, etc - core datatable feature
    stateSave: true,
    // Allow export to CSV
    buttons: ["csv"],
  });

  return g_data_table;
}

function getParam(obj, key) {
  if (typeof obj[key] === "undefined") {
    return null;
  }

  return obj[key];
}

$(document).ready(function () {
  $.ajax({
    url: "data.json",
  }).then(function (res) {
    $.ajax({
      url: "currency.json",
    }).then(function (currencies) {
      loaded_data = res;
      var allRegions = [];
      for (var type in res) {
        var typeSize = res[type];

        for (var typeInfo in typeSize) {
          var typeSpecs =
            res[type][typeInfo] &&
            typeof res[type][typeInfo].specs !== "undefined"
              ? res[type][typeInfo].specs
              : {};
          var typeRegions =
            res[type][typeInfo] &&
            typeof res[type][typeInfo].regions !== "undefined"
              ? res[type][typeInfo].regions
              : {};

          for (var region in typeRegions) {
            if (
              region !== "australia" &&
              region !== "asia" &&
              region !== "us" &&
              region !== "asia" &&
              region !== "europe"
            ) {
              if (allRegions.indexOf(region) === -1) {
                allRegions.push(region);
              }
            }
          }
        }
      }

      allRegions
        .sort(function (a, b) {
          return a.localeCompare(b);
        })
        .forEach(function (val) {
          $("#region-menu").append(
            '<li><a href="javascript:;" data-region="' +
              val +
              '">' +
              val +
              "</a></li>"
          );
        });

      $("#currency-menu").append(
        '<li><a href="javascript:;" data-currency="USD" data-price="1" data-symbol="$">' +
          "USD" +
          "</a></li>"
      );
      for (var val in currencies) {
        $("#currency-menu").append(
          '<li><a href="javascript:;" data-currency="' +
            val +
            '" data-price="' +
            currencies[val]["price"] +
            '" data-symbol="' +
            currencies[val]["symbol"] +
            '">' +
            val +
            "</a></li>"
        );
      }

      generate_data_table(g_settings.region);
      init_data_table(instances_data);
    });
  });
});

function getSupportedStr(val) {
  if (val === 1) {
    return "Supported";
  } else if (val === 0) {
    return "Not supported";
  } else if (val === -1) {
    return "Unknown";
  }

  return null;
}

function generate_data_table(region, multiplier = 1, per_time = "hourly") {
  var res = loaded_data;

  instances_data.length = 0;

  for (var type in res) {
    if (type === "license") {
      continue;
    }

    var typeSize = res[type];

    for (var typeInfo in typeSize) {
      var row = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      row[0] = typeInfo;

      var typeSpecs =
        res[type][typeInfo] && typeof res[type][typeInfo].specs !== "undefined"
          ? res[type][typeInfo].specs
          : {};
      var typeRegions =
        res[type][typeInfo] &&
        typeof res[type][typeInfo].regions !== "undefined"
          ? res[type][typeInfo].regions
          : {};

      var min_memory = getParam(g_settings, "min_memory");
      var min_vcpus = getParam(g_settings, "min_vcpus");

      row[1] = getParam(typeSpecs, "cores");

      if (row[1] < min_vcpus || (min_vcpus && row[1] === "shared")) {
        continue;
      }

      row[2] = getParam(typeSpecs, "memory");

      if (Number(row[2]) < Number(min_memory)) {
        continue;
      }

      row[2] = row[2] + " GiB";

      row[3] = getSupportedStr(getParam(typeSpecs, "local_ssd"));
      row[4] = getParam(typeSpecs, "network_egress");
      row[4] = row[4] ? row[4] + " Gigabit" : "Unknown";
      row[5] = getParam(typeSpecs, "cpu").join(", ");
      row[6] = getSupportedStr(getParam(typeSpecs, "gpu"));
      row[7] = getSupportedStr(getParam(typeSpecs, "sole_tenant"));
      row[8] = getSupportedStr(getParam(typeSpecs, "nested_virtualization"));
      row[9] = getParam(typeSpecs, "benchmark");

      var curRegion = getParam(typeRegions, region);

      // Linux on demand
      row[10] = curRegion ? getParam(curRegion, "ondemand") : null;
      row[11] = curRegion ? getParam(curRegion, "sud") : null;
      row[12] = curRegion ? getParam(curRegion, "preemptible") : null;
      row[13] = curRegion ? getParam(curRegion, "cud-1y") : null;
      row[14] = curRegion ? getParam(curRegion, "cud-3y") : null;

      // Windows on demand
      var cores = row[1] === "shared" ? 0 : Number(row[1]);
      var license_cost =
        type === "f1-small" || type === "g1-small"
          ? Number(res["license"]["win"]["low"])
          : Number(res["license"]["win"]["high"]);
      row[15] =
        Number(curRegion ? getParam(curRegion, "ondemand") : 0) +
        cores * license_cost;
      row[16] =
        Number(curRegion ? getParam(curRegion, "sud") : 0) +
        cores * license_cost;
      row[17] =
        Number(curRegion ? getParam(curRegion, "preemptible") : 0) +
        cores * license_cost;
      row[18] =
        Number(curRegion ? getParam(curRegion, "cud-1y") : 0) +
        cores * license_cost;
      row[19] =
        Number(curRegion ? getParam(curRegion, "cud-3y") : 0) +
        cores * license_cost;

      if (row[1] !== "shared") {
        row[1] += " vCPUs";
      }

      for (var k = 10; k < 20; k++) {
        if (row[k]) {
          row[k] *= multiplier;
          row[k] = row[k]
            .toFixed(per_time == "secondly" ? 8 : 5)
            .replace(/(0)*$/, "");
          row[k] += " " + per_time;
          row[k] = g_settings.symbol + row[k];
        } else {
          row[k] = "Unavailable";
        }
      }

      instances_data.push(row);
    }
  }
}

function change_cost(duration) {
  // update menu text
  var first = duration.charAt(0).toUpperCase();
  var text = first + duration.substr(1);
  $("#cost-dropdown .dropdown-toggle .text").text(text);

  // update selected menu option
  $("#cost-dropdown li a").each(function (i, e) {
    e = $(e);
    if (e.attr("duration") == duration) {
      e.parent().addClass("active-line");
    } else {
      e.parent().removeClass("active-line");
    }
  });

  var hour_multipliers = {
    secondly: 1 / (60 * 60),
    hourly: 1,
    daily: 24,
    weekly: 7 * 24,
    monthly: (365 * 24) / 12,
    annually: 365 * 24,
  };
  var multiplier = hour_multipliers[duration];
  multiplier = multiplier * g_settings.price;
  var per_time;

  generate_data_table(g_settings.region, multiplier, duration);

  g_data_table.clear();
  g_data_table.rows.add(instances_data);
  g_data_table.draw();

  g_settings.compare_on = false;
  update_compare_button();

  var $rows = $("#data tbody tr");

  $rows.unbind("click").click(function () {
    $(this).toggleClass("highlight");

    g_settings.compare_on = false;
    update_compare_button();
    maybe_update_url();
  });

  g_settings.cost_duration = duration;
  maybe_update_url();
}

function change_currency(currency, price, symbol) {
  g_settings.currency = currency;
  g_settings.price = Number(price);
  g_settings.symbol = symbol;

  var currency_name = null;
  $("#currency-dropdown li a").each(function (i, e) {
    e = $(e);
    if (e.data("currency") === currency) {
      e.parent().addClass("active-line");
      currency_name = e.data("symbol") + " (" + e.data("currency") + ")";
    } else {
      e.parent().removeClass("active-line");
    }
  });
  $("#currency-dropdown .dropdown-toggle .text").text(currency_name);
  change_cost(g_settings.cost_duration);
}

function change_region(region) {
  g_settings.region = region;
  var region_name = null;
  $("#region-dropdown li a").each(function (i, e) {
    e = $(e);
    if (e.data("region") === region) {
      e.parent().addClass("active-line");
      region_name = e.text();
    } else {
      e.parent().removeClass("active-line");
    }
  });
  $("#region-dropdown .dropdown-toggle .text").text(region_name);

  change_cost(g_settings.cost_duration);

  g_data_table.clear();
  g_data_table.rows.add(instances_data);
  g_data_table.draw();

  g_settings.compare_on = false;
  update_compare_button();

  var $rows = $("#data tbody tr");

  $rows.unbind("click").click(function () {
    $(this).toggleClass("highlight");

    g_settings.compare_on = false;
    update_compare_button();
    maybe_update_url();
  });
}

function change_reserved_term(term) {
  g_settings.reserved_term = term;
  var $dropdown = $("#reserved-term-dropdown"),
    $activeLink = $dropdown.find('li a[data-reserved-term="' + term + '"]'),
    term_name = $activeLink.text();

  $dropdown.find("li").removeClass("active-line");
  $activeLink.closest("li").addClass("active-line");

  $dropdown.find(".dropdown-toggle .text").text(term_name);
  // 1change_cost(g_settings.cost_duration);
}

// Update all visible costs to the current duration.
// Called after new columns or rows are shown as their costs may be inaccurate.
function redraw_costs() {
  // 2change_cost(g_settings.cost_duration);
}

function setup_column_toggle() {
  $.each(g_data_table.columns().indexes(), function (i, idx) {
    var column = g_data_table.column(idx);
    $("#filter-dropdown ul").append(
      $("<li>")
        .toggleClass("active-line", column.visible())
        .append(
          $("<a>", { href: "javascript:;" })
            .text($(column.header()).text())
            .click(function (e) {
              toggle_column(i);
              $(this).parent().toggleClass("active-line");
              $(this).blur(); // prevent focus style from sticking in Firefox
              e.stopPropagation(); // keep dropdown menu open
            })
        )
    );
  });
}

function setup_clear() {
  $(".btn-clear").click(function () {
    // Reset app.
    g_settings = JSON.parse(JSON.stringify(g_settings_defaults)); // clone
    g_data_table.search("");
    clear_row_selections();
    maybe_update_url();
    store.clear();
    g_data_table.state.clear();
    window.location.reload();
  });
}

function clear_row_selections() {
  $("#data tbody tr").removeClass("highlight");
}

function url_for_selections() {
  var params = {
    min_memory: g_settings.min_memory,
    min_vcpus: g_settings.min_vcpus,
    min_storage: g_settings.min_storage,
    filter: g_data_table.settings()[0].oPreviousSearch["sSearch"],
    region: g_settings.region,
    cost_duration: g_settings.cost_duration,
    reserved_term: g_settings.reserved_term,
    compare_on: g_settings.compare_on,
  };

  // avoid storing empty or default values in URL
  for (var key in params) {
    if (
      params[key] === "" ||
      params[key] == null ||
      params[key] === g_settings_defaults[key]
    ) {
      delete params[key];
    }
  }

  // selected rows
  var selected_row_ids = $("#data tbody tr.highlight")
    .map(function () {
      return this.id;
    })
    .get();
  if (selected_row_ids.length > 0) {
    params.selected = selected_row_ids;
  }

  var url = location.origin + location.pathname;
  var parameters = [];
  for (var setting in params) {
    if (params[setting] !== undefined) {
      parameters.push(setting + "=" + params[setting]);
    }
  }
  if (parameters.length > 0) {
    url = url + "?" + parameters.join("&");
  }
  return url;
}

function maybe_update_url() {
  // Save localstorage data as well
  store.set("ec2_settings", g_settings);

  if (!history.replaceState) {
    return;
  }

  try {
    var url = url_for_selections();
    if (document.location == url) {
      return;
    }

    history.replaceState(null, "", url);
  } catch (ex) {
    // doesn't matter
  }
}

var apply_min_values = function () {
  var all_filters = $('[data-action="datafilter"]');
  var data_rows = $("#data tr:has(td)");

  // data_rows.show();

  all_filters.each(function () {
    var filter_on = $(this).data("type");
    var filter_val = parseFloat($(this).val()) || 0;

    // update global variable for dynamic URL
    g_settings["min_" + filter_on] = filter_val;

    /* var match_fail = data_rows.filter(function () {
      var row_val;
      row_val = parseFloat(
        $(this).find('td[class~="' + filter_on + '"] span').attr('sort')
      );
      return row_val < filter_val;
    });

    match_fail.hide();*/
  });
  maybe_update_url();

  change_region(g_settings_defaults.region);
};

function on_data_table_initialized() {
  if (g_app_initialized) return;
  g_app_initialized = true;

  load_settings();

  // populate filter inputs
  // $('[data-action="datafilter"][data-type="memory"]').val(
  //   g_settings["min_memory"]
  // );
  // $('[data-action="datafilter"][data-type="vcpus"]').val(
  //   g_settings["min_vcpus"]
  // );

  $('[data-action="datafilter"][data-type="storage"]').val(
    g_settings["min_storage"]
  );
  g_data_table.search(g_settings["filter"]);
  apply_min_values();

  // apply highlight to selected rows
  $.each(g_settings.selected.split(","), function (_, id) {
    id = id.replace(".", "\\.");
    $("#" + id).addClass("highlight");
  });

  configure_highlighting();

  // Allow row filtering by min-value match.
  $("[data-action=datafilter]").on("keyup", apply_min_values);

  // change_region(g_settings.region);
  // change_cost(g_settings.cost_duration);
  // change_reserved_term(g_settings.reserved_term);

  $.extend($.fn.dataTableExt.oStdClasses, {
    sWrapper: "dataTables_wrapper form-inline",
  });

  setup_column_toggle();

  setup_clear();

  // enable bootstrap tooltips
  $("abbr").tooltip({
    placement: function (tt, el) {
      return this.$element.parents("thead").length ? "top" : "right";
    },
  });

  $("#cost-dropdown li").bind("click", function (e) {
    change_cost(e.target.getAttribute("duration"));
  });

  $("#region-dropdown li").bind("click", function (e) {
    change_region($(e.target).data("region"));
  });

  $("#currency-dropdown li").bind("click", function (e) {
    change_currency(
      $(e.target).data("currency"),
      $(e.target).data("price"),
      $(e.target).data("symbol")
    );
  });

  change_currency(g_settings.currency, g_settings.price, g_settings.symbol);

  $("#reserved-term-dropdown li").bind("click", function (e) {
    change_reserved_term($(e.target).data("reservedTerm"));
  });

  $('#csv').bind('click', function (e) {
    e.preventDefault();
    g_data_table.button('.buttons-csv').trigger();
  });
}

// sorting for colums with more complex data
// http://datatables.net/plug-ins/sorting#hidden_title
jQuery.extend(jQuery.fn.dataTableExt.oSort, {
  "span-sort-pre": function (elem) {
    var matches = elem.match(/sort="(.*?)"/);
    if (matches) {
      return parseFloat(matches[1]);
    }
    return 0;
  },

  "span-sort-asc": function (a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  },

  "span-sort-desc": function (a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
  },

  "cust-sort-pre": function (elem) {
    var parts = elem.split(" ");
    if (parts.length === 1) {
      return 1e6;
    }

    let res;
    if (parts[0][0] === "C") {
      res = parts[0].replace("CHF", "");
    } else if (parts[0][0] === "k") {
      res = parts[0].replace("kr", "");
    } else {
      res = parts[0].replace(parts[0][0], "");
    }

    return Number(res);
  },

  "cust-sort-asc": function (a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  },

  "cust-sort-desc": function (a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
  },
});

// toggle columns
function toggle_column(col_index) {
  var is_visible = g_data_table.column(col_index).visible();
  g_data_table.column(col_index).visible(is_visible ? false : true);
  redraw_costs();
}

// retrieve all the parameters from the location string
function load_settings() {
  // load settings from local storage
  g_settings = store.get("ec2_settings") || {};

  if (location.search) {
    var params = location.search.slice(1).split("&");
    params.forEach(function (param) {
      var parts = param.split("=");
      var key = parts[0];
      var val = parts[1];
      // support legacy key names
      if (key == "cost") {
        key = "cost_duration";
      } else if (key == "term") {
        key = "reserved_term";
      }
      // store in global settings
      console.log("Loaded setting from URL:", key, "=", val);
      g_settings[key] = val;
    });
  }

  // use default settings for missing values
  for (var key in g_settings_defaults) {
    if (g_settings[key] === undefined) {
      g_settings[key] = g_settings_defaults[key];
    }
  }

  return g_settings;
}

function configure_highlighting() {
  var $compareBtn = $(".btn-compare"),
    $rows = $("#data tbody tr");

  // Allow row highlighting by clicking.
  $rows.unbind("click").click(function () {
    $(this).toggleClass("highlight");

    update_compare_button();
    maybe_update_url();
  });

  $compareBtn.click(function () {
    g_settings.compare_on = !g_settings.compare_on;
    update_compare_button();
    update_visible_rows();
    maybe_update_url();
  });

  update_compare_button();
  update_visible_rows();
}

function update_visible_rows() {
  var $rows = $("#data tbody tr");
  if (!g_settings.compare_on) {
    $rows.show();
  } else {
    $rows.filter(":not(.highlight)").hide();
  }
}

function update_compare_button() {
  var $compareBtn = $(".btn-compare"),
    $rows = $("#data tbody tr");

  if (!g_settings.compare_on) {
    $compareBtn
      .text($compareBtn.data("textOff"))
      .removeClass("end-compare")
      .prop("disabled", !$rows.is(".highlight"));
  } else {
    $compareBtn.text($compareBtn.data("textOn")).addClass("end-compare");
  }
}
