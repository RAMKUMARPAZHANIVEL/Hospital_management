import React, { useEffect, useMemo, useState } from "react";
import { Box, Tabs,Tab,Typography, Checkbox, Button, IconButton, RadioGroup,FormControlLabel, Radio,Chip,Stack,Paper, Grid2 as Grid, styled, Divider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Add as AddIcon, ArrowLeft as ArrowLeftIcon } from "@mui/icons-material";
import dayjs from "dayjs";
import * as Api from "shared/services";
import Session from "shared/session";

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: 'none',
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.pxToRem(15),
    marginRight: theme.spacing(1),
    color: 'rgba(0, 0, 0, 0.7)',
    '&.Mui-selected': {
      color: 'rgba(98, 77, 227, 1)',
      fontWeight: '700'
    },
    '&.Mui-focusVisible': {
      backgroundColor: 'rgba(100, 95, 228, 0.32)',
    },
  }),
);

// ---------- Helpers (JS) ----------
// Generate slot array stepping by span minutes (no dayjs plugins required)
const generateSlotsFromWindow = (start, end, span) => {
  if (!start || !end) return [];
  let cur = dayjs(start);
  const endD = dayjs(end);
  const out = [];
  while (cur.isBefore(endD)) {
    const nxt = cur.add(span, "minute");
    if (nxt.isAfter(endD)) break;
    out.push({
      StartTime: cur.format("HH:mm:ss"),
      EndTime: nxt.format("HH:mm:ss"),
    });
    cur = nxt;
  }
  return out;
};

// Given DB slots for a date, group into continuous windows
const groupDbSlotsToWindows = (slots, specificDate) => {
  if (!slots || slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => (a.StartTime > b.StartTime ? 1 : -1));
  const windows = [];
  let curStart = sorted[0].StartTime;
  let curEnd = sorted[0].EndTime;
  let bucket = [
    { Date: specificDate, SlotId: sorted[0].SlotId || 0, StartTime: sorted[0].StartTime, EndTime: sorted[0].EndTime },
  ];

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    if (s.StartTime === curEnd) {
      curEnd = s.EndTime;
      bucket.push({ Date: specificDate, SlotId: s.SlotId || 0, StartTime: s.StartTime, EndTime: s.EndTime });
    } else {
      windows.push({ start: dayjs(`${specificDate} ${curStart}`), end: dayjs(`${specificDate} ${curEnd}`), slots: bucket });
      curStart = s.StartTime;
      curEnd = s.EndTime;
      bucket = [
        { Date: specificDate, SlotId: s.SlotId || 0, StartTime: s.StartTime, EndTime: s.EndTime },
      ];
    }
  }
  windows.push({ start: dayjs(`${specificDate} ${curStart}`), end: dayjs(`${specificDate} ${curEnd}`), slots: bucket });
  return windows;
};

// Get weeks of a month as arrays of dayjs dates (calendar weeks by 7-day chunks)
const getMonthWeeks = (month) => {
  const start = dayjs(month).startOf("month");
  const end = dayjs(month).endOf("month");
  const days = [];
  let d = start;
  while (d.isSame(end) || d.isBefore(end)) {
    days.push(d);
    d = d.add(1, "day");
  }
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
};

const getNext7Days = () => {
  const days = [];
  let d = dayjs();
  for (let i = 0; i < 7; i++) {
    days.push(d);
    d = d.add(1, "day");
  }
  return days;
};

const Component =  (props) => {
    const {
      initialDbData = [],
      defaultMode = "view",
      defaultAvailabilityType = "SpecificDate",
      onSave,
    } = props;

    const [mode, setMode] = useState(defaultMode);
    const [availabilityType, setAvailabilityType] = useState(defaultAvailabilityType);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf("month"));
    const [tabIndex, setTabIndex] = useState(0);
    const [sessionSpan, setSessionSpan] = useState(30);
    const [dataMap, setDataMap] = useState({});
    const [editing, setEditing] = useState({
        open: false,
        dateKey: null,
        windowIndex: null,
        start: null,
        end: null,
        sessionSpan: null
    });

    useEffect(() => {
        if (!initialDbData || initialDbData.length === 0) return;
        const next = {};
        initialDbData.forEach((row) => {
            const dateKey = row.SpecificDate; // YYYY-MM-DD
            const windows = groupDbSlotsToWindows(row.Slots || [], dateKey);
            next[dateKey] = {
                id: row.AvailabiltyId,
                SpecificDate: dateKey,
                Type: row.Type || "SpecificDate",
                AvailabilityDoctor: row.AvailabilityDoctor,
                Windows: windows,
                checked: true,
            };
        });
        setDataMap(next);
    }, [initialDbData]);

    const weeks = useMemo(() => getMonthWeeks(selectedMonth), [selectedMonth]);

    // ---------- Handlers ----------
    const toggleDayChecked = (date, checked) => {
      if(mode === "edit") {
        const key = dayjs(date).format("YYYY-MM-DD");
        setDataMap((prev) => {
            const existing = prev[key] || {
                SpecificDate: key,
                Type: availabilityType,
                AvailabilityDoctor: 1,
                Windows: [],
                checked: false,
            };
            return { ...prev, [key]: { ...existing, checked } };
        });
      }
    };

    const addWindow = (dateOrKey, start, end) => {
        const key = typeof dateOrKey === "string" ? dateOrKey : dayjs(dateOrKey).format("YYYY-MM-DD");
        setDataMap((prev) => {
          const existing = prev[key] || {
            SpecificDate: key,
            Type: availabilityType,
            AvailabilityDoctor: 1,
            Windows: [],
            checked: true,
          };
          const slots = generateSlotsFromWindow(start, end, sessionSpan);
          const updated = {
            ...existing,
            Windows: [...existing.Windows, { start, end, slots }],
            checked: true,
          };
          return { ...prev, [key]: updated };
        });
    };

    const deleteWindow = async (dateKey, wIndex) => {
        console.log(dateKey, wIndex);
        const slotIds = dataMap[dateKey].Windows[0].slots.map(x => x.SlotId);

        const results = await Promise.allSettled(
          slotIds.map(SlotId => Api.SetSlotSingle({ SlotId, Deleted: true }))
        );
        setDataMap((prev) => {
            const existing = prev[dateKey];
            if (!existing) return prev;
            const newWindows = existing.Windows.filter((_, idx) => idx !== wIndex);
            const stillChecked = newWindows.length > 0 ? existing.checked : false;
            return { ...prev, [dateKey]: { ...existing, Windows: newWindows, checked: stillChecked } };
        });
    };

    const openAddWindow = (date) => {
      const key = dayjs(date).format("YYYY-MM-DD");
      setEditing({ open: true, dateKey: key, windowIndex: null, start: dayjs(date).hour(10).minute(0), end: dayjs(date).hour(12).minute(0), sessionSpan: 30 });
    };

    const commitEdit = () => {
      if (!editing.dateKey) return;
      addWindow(editing.dateKey, editing.start, editing.end);
      const newDate = dataMap[editing.dateKey];
      console.log(editing, newDate);
      const slots = generateSlotsFromWindow(editing.start, editing.end, sessionSpan);
      const doctorId = parseInt(Session.Retrieve("Id"));
      
      const data = {
          SpecificDate: newDate.SpecificDate,
          Type: newDate.Type,
          AvailabilityDoctor: doctorId,
          Slots: slots
      };

      if(newDate.id) data['AvailabiltyId'] = newDate.id;
      if(onSave) onSave(data);
      setEditing({ open: false, dateKey: null, windowIndex: null, start: null, end: null, sessionSpan: null });
    };

    // ---------- Render Helpers ----------
    const DayRow = ({ date }) => {
      const key = dayjs(date).format("YYYY-MM-DD");
      const entry = dataMap[key];
      const isChecked = entry?.checked || false;
      const totalSessions = (entry?.Windows || []).reduce((sum, w) => sum + (w.slots?.length || 0), 0);

      return (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Checkbox checked={isChecked} onChange={(e) => toggleDayChecked(date, e.target.checked)} />

            <Typography variant="body2" sx={{ width: 160, fontWeight: '500' }}>{dayjs(date).format("DD MMM YYYY, ddd")}</Typography>
            <Chip size="small" label={`${totalSessions} sessions`} />

            {mode === "edit" && (
              <Button size="small" sx={{ marginLeft: 'auto !important' }}
                startIcon={<AddIcon />} disabled={!isChecked} onClick={() => openAddWindow(date)}
              >
                Add window
              </Button>
            )}
          </Stack>

          {/* windows list */}
          <Box sx={{ pl: 6, pt: 1 }}>
            {(entry?.Windows || []).map((w, idx) => (
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Chip label={`${dayjs(w.start).format("hh:mm A")} – ${dayjs(w.end).format("hh:mm A")}`} />
                <Typography variant="body2">({w.slots.length} sessions)</Typography>
                {mode === "edit" && (
                  <>
                    <IconButton size="small" onClick={() => deleteWindow(key, idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Stack>
            ))}
            {!entry?.Windows?.length && isChecked && (
              <Typography variant="body2" color="text.secondary">No windows yet — click "Add window".</Typography>
            )}
            {!isChecked && <Typography variant="body2" color="text.secondary">Unavailable</Typography>}
          </Box>
        </Paper>
      );
    };

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ p: 2 }}>
          <Stack direction="column" spacing={5} alignItems="flex-start">
            {/* Availability Type */}
            <Box sx={{ width: '90%' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 3 }}>Availability Type:</Typography>
              <RadioGroup row value={availabilityType} onChange={(e) => setAvailabilityType(e.target.value)}
                sx={{ borderRadius: 2, border: "1px solid #E7E7E7", padding: '24px 40px' }}
              >
                  <Grid container rowSpacing={1} justifyContent='space-between' columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ width: '100%'}}>
                      <Grid size={5}>
                        <FormControlLabel value="Weekly" control={<Radio />} label="Weekly" />
                        <Typography variant="caption" component='div'>
                            You are available one or more times during the week, every week.
                        </Typography>
                      </Grid>
                      <Grid size={5}>
                          <FormControlLabel value="SpecificDate" control={<Radio />} label="Specific Date" />
                          <Typography variant="caption" component='div'>
                              You are available on specific dates.
                          </Typography>
                      </Grid>
                  </Grid> 
              </RadioGroup>
            </Box>
          </Stack>

          <Stack direction={'row'} alignItems='center' justifyContent='space-between' sx={{ mt: 5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Define your availability below
            </Typography>

            {mode === 'view' ?
              <Button startIcon={<EditIcon sx={{ width : 16 }}/>}
                  variant="outlined"
                  onClick={() => {
                  setMode(mode === 'edit' ? 'view' : 'edit')
                  }}
                  sx={{ width: '155px', py: '14px', borderRadius: 2 }}
              >
                  Edit Schedule
              </Button>
              : 
              <Button variant="contained" startIcon={<ArrowLeftIcon />}
                onClick={() => setMode(mode === 'edit' ? 'view' : 'edit') }
                sx={{ height: 35 }}
              >
                Back
              </Button>
            }
          </Stack>

            <DatePicker
                views={["year", "month"]}
                label="Select month"
                value={selectedMonth}
                onChange={(v) => {
                  if (!v) return;
                  setSelectedMonth(dayjs(v).startOf("month"));
                  setTabIndex(0);
                }}
                sx={{ my: 2, width: '200px' }}
            />

          {availabilityType === 'SpecificDate' && (
              <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
                  {getMonthWeeks(selectedMonth).map((_, i) => (
                    <StyledTab key={i} label={`Week ${i + 1}`}  
                      sx={{ fontSize: '14px', fontWeight: '500' }}
                      />
                  ))}
              </Tabs>
          )}

          <Box sx={{ mt: 2 }}>
            {(availabilityType === "Weekly" ? getNext7Days() : getMonthWeeks(selectedMonth)[tabIndex] || [])?.map((date) => (
              <DayRow key={dayjs(date).format("YYYY-MM-DD")} date={date} />
            ))}
          </Box>
        </Box>

        {editing.open && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300,
            }}
            onClick={() => setEditing({ open: false, dateKey: null, windowIndex: null, start: null, end: null, sessionSpan: null })}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ bgcolor: "background.paper", p: 2, borderRadius: 2, minWidth: 360 }}
            >
                <Typography variant="h6" sx={{ mb: 1 }}>{editing.windowIndex === null ? "Add window" : "Edit window"}</Typography>
                <Divider />
                <Stack spacing={2} sx={{ py: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold',  mb: 2 }}>Time:</Typography>

                    <Stack direction={'row'} sx={{ gap: 4 }}> 
                       <TimePicker label="Start" value={editing.start} onChange={(v) => setEditing((p) => ({ ...p, start: v }))} />
                       <TimePicker label="End" value={editing.end} onChange={(v) => setEditing((p) => ({ ...p, end: v }))} />
                    </Stack>

                    {/* Session Span */}
                    <Box sx={{ width: '90%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold',  mb: 2 }}>Session span:</Typography>
                        <RadioGroup row value={editing.sessionSpan} onChange={(e) => setEditing((p) => ({ ...p, sessionSpan: e.target.value }))}
                            sx={{ borderRadius: 2, border: "1px solid #E7E7E7", padding: '24px 40px' }}
                        >
                            <Grid container rowSpacing={1} justifyContent='space-between' columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ width: '100%'}}>
                                <Grid size={5}>
                                    <FormControlLabel value="15" control={<Radio />} label="15m" />
                                    <Typography variant="caption" component='div'>
                                      Each of your appointed session will be 15 minutes long.
                                    </Typography>
                                </Grid>
                                <Grid size={5}>
                                    <FormControlLabel value="30" control={<Radio />} label="30m" />
                                    <Typography variant="caption" component='div'>
                                      Each of your appointed session will be 30 minutes long.
                                    </Typography>
                                </Grid>
                            </Grid> 
                        </RadioGroup>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="medium" label={`Sessions: ${generateSlotsFromWindow(editing.start, editing.end, editing.sessionSpan, () => 0).length}`} />
                    </Stack>

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button onClick={() => setEditing({ open: false, dateKey: null, windowIndex: null, start: null, end: null })}>Cancel</Button>
                      <Button variant="contained" onClick={commitEdit} disabled={!editing.start || !editing.end || dayjs(editing.end).isSame(dayjs(editing.start)) || dayjs(editing.end).isBefore(dayjs(editing.start))}>Save</Button>
                    </Stack>
                </Stack>
            </Box>
          </Box>
        )}
      </LocalizationProvider>
    );
}

export default Component;