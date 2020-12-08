import React, {Component} from "react";
import {
  CalendarEventsInterface,
  getCalendarEvents,
  getObjectDetectionImage,
  getObjectDetectionImageFileNameForCroppedImageName,
  ObjectDetectionImageFileNameInterface,
  ObjectDetectionImageInterface
} from "../../../utils/HttpUtils";
import FullCalendar, {EventClickArg} from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {Card} from "react-bootstrap";
import {GenericImageModal, ModalPropsInterface} from "../../../components/GenericImageModal/GenericImageModal";
import DateRangeSelector from "../DateRangeSelector/DateRangeSelector";
import {ReduxPropsInterface} from "../../../store/reducers/dateReducer";
import {connect} from "react-redux";
import {WithTranslation, withTranslation} from "react-i18next";
import {ChangeDate, getNowISODate} from "../../../utils/DateUtils";
import {DATE_RANGE_START_DATE_SELECTED} from "../../../store/actionTypes";

class Calendar extends Component<ReduxPropsInterface & WithTranslation> {
  state = {
    dateRangeStartDate: null,
    dateRangeEndDate: null,
    calendarWeekends: true,
    calendarEvents: [] as CalendarEventsInterface[],
    genericImageModalData: {show: false} as ModalPropsInterface,
    windowWidth: window.innerWidth,
  };

  calendarComponentRef = React.createRef<FullCalendar>();

  componentDidMount(): void {
    // Override start date to be today to avoid problems
    this.props.onDateRangeStartDateSelected({target: {value: ChangeDate(getNowISODate(), -7)}});
    // Load events by default from past week
    this.loadCalendarEvents().then(() => null);
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    this.setState({windowWidth: window.innerWidth});
  };

  componentDidUpdate(prevProps: Readonly<ReduxPropsInterface>, prevState: Readonly<{}>, snapshot?: any): void {
    if (this.state.dateRangeStartDate !== this.props.dateRangeStartDate
      || this.state.dateRangeEndDate !== this.props.dateRangeEndDate) {
      this.loadCalendarEvents().then(() => null);
    }
  }

  async loadCalendarEvents() {
    const events = await getCalendarEvents(this.props.dateRangeStartDate, this.props.dateRangeEndDate);
    this.setState({
      calendarEvents: events,
      dateRangeStartDate: this.props.dateRangeStartDate,
      dateRangeEndDate: this.props.dateRangeEndDate
    });
  }

  render() {
    const {t} = this.props;

    const width = this.state.windowWidth;
    const initialView = width > 500 ? 'timeGridWeek' : 'timeGridDay';

    return (
      <div>
        <Card bg="Light" text="dark">
          <Card.Header>
            <b>{t('home.calendar.vehicle_activity')}</b>
          </Card.Header>
          <Card.Body>
            <div>
              <DateRangeSelector {...this.props}/>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                ref={this.calendarComponentRef}
                weekends={this.state.calendarWeekends}
                events={this.state.calendarEvents}
                dateClick={this.handleDateClick}
                eventClick={this.handleEventClick}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView={initialView}
                height={600}
              />
            </div>
          </Card.Body>
        </Card>

        <GenericImageModal
          t={t}
          closeHandler={() => this.genericImageModalCloseHandler}
          show={this.state.genericImageModalData.show}
          description={this.state.genericImageModalData.description}
          src={this.state.genericImageModalData.src}
          title={this.state.genericImageModalData.title}
          showBadges={this.state.genericImageModalData.showBadges}
          srImage={this.state.genericImageModalData.srImage}
          detectionResult={this.state.genericImageModalData.detectionResult}
          color={this.state.genericImageModalData.color}
          additionalInfo={this.state.genericImageModalData.additionalInfo}
        />

      </div>
    )
  }

  handleDateClick = (arg: any) => {
    // console.log(arg);
  };

  handleEventClick = (clickInfo: EventClickArg) => {
    const title = clickInfo.event.title;
    const file = clickInfo.event.extendedProps.file_name_cropped;
    const description = clickInfo.event.extendedProps.description;
    this.loadObjectDetectionImageHandler(file, title, description).then(() => null);
  };

  async loadObjectDetectionImageHandler(croppedImageName: string, detectionResult: string, description: string) {
    this.setState({isLoading: true});
    const file = await getObjectDetectionImageFileNameForCroppedImageName(croppedImageName) as ObjectDetectionImageFileNameInterface;
    const image = await getObjectDetectionImage(file.file_name) as ObjectDetectionImageInterface;
    this.setState({
      isLoading: false,
      genericImageModalData: {
        show: true,
        title: image.file_name,
        description: this.props.t('home.calendar.originalLicensePlateImage'),
        src: image.data,
        showBadges: true,
        detectionResult: detectionResult,
        additionalInfo: description,
      }
    });
  };

  genericImageModalCloseHandler = () => {
    this.setState({genericImageModalData: {show: false}});
  };

}

const mapStateToProps = (state: any): any => {
  return {
    dateRangeStartDate: state.dateReducer.dateRangeStartDate,
    dateRangeEndDate: state.dateReducer.dateRangeEndDate,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    onDateRangeStartDateSelected: (value: string) => dispatch({type: DATE_RANGE_START_DATE_SELECTED, calendar: value}),
  }
};


export default connect(mapStateToProps, mapDispatchToProps)(withTranslation('i18n')(Calendar));
