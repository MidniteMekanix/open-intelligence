import React, {Component} from "react";
import {ReduxPropsInterface} from "../../../store/reducers/dateReducer";
import {Card} from "react-bootstrap";
import DateRangeSelector from "../../Home/DateRangeSelector/DateRangeSelector";
import {
  addLicensePlate,
  getLicensePlateDetections,
  LicensePlateDetectionsInterface,
} from "../../../utils/HttpUtils";
import {getNowISODate} from "../../../utils/DateUtils";
import styles from './Cars.module.css'
import {PlateEditModal, PlateEditModalPropsInterface} from "../../../components/PlateEditModal/PlateEditModal";
import {filterLicensePlate} from "../../../utils/TextUtils";
import {connect} from "react-redux";

class Cars extends Component<ReduxPropsInterface> {
  state = {
    isLoading: false,
    today: getNowISODate(),
    resultOption: 'owner_detail_needed',
    totalPlates: 0,
    licensePlateDetections: [] as LicensePlateDetectionsInterface[],
    plateEditModalData: {show: false} as PlateEditModalPropsInterface,
    dateRangeStartDate: null,
    dateRangeEndDate: null,
  };

  componentDidUpdate(prevProps: Readonly<ReduxPropsInterface>, prevState: Readonly<{}>, snapshot?: any): void {
    if (this.state.dateRangeStartDate !== this.props.dateRangeStartDate
      || this.state.dateRangeEndDate !== this.props.dateRangeEndDate) {
      console.log('component update event');
      this.loadLicensePlateDetections(this.props.dateRangeStartDate, this.props.dateRangeEndDate).then(() => null);
    }
  }

  componentDidMount(): void {
    // Default will load only today contents, loading big chunk is slow
    this.loadLicensePlateDetections(this.state.today, this.state.today).then(() => null);
  }

  async loadLicensePlateDetections(startDate: string, endDate: string) {
    const licensePlateDetections = await getLicensePlateDetections(
      this.state.resultOption, startDate, endDate) as LicensePlateDetectionsInterface[];
    this.setState({
      dateRangeStartDate: startDate,
      dateRangeEndDate: endDate,
      licensePlateDetections: licensePlateDetections
    });
  }

  render() {
    let cars: JSX.Element[] = [];

    if (this.state.licensePlateDetections !== undefined) {
      if (this.state.licensePlateDetections.length > 0) {
        cars = this.state.licensePlateDetections.map(detection => {
          return (
            <div key={detection.file}
                 className={styles.zoom}
                 style={{cursor: 'pointer'}}
                 onClick={() => this.addNewPlateHandler(detection)}>
              <Card style={{maxWidth: '160px'}} className="mr-1 mt-1 ml-1 mb-1">
                <Card.Img variant="top" src={detection.image} style={{maxHeight: '100px'}}/>
                <Card.Body className="p-2">
                  <Card.Title className="m-0">{detection.detectionResult}</Card.Title>
                </Card.Body>
                <Card.Footer className="p-2">
                  <small className="text-muted">{detection.title}</small>
                </Card.Footer>
              </Card>
            </div>
          )
        });
      }
    }

    return (
      <div>
        <div className="magictime vanishIn">
          <Card bg="Light" text="dark">
            <Card.Header>
              <b>Unknown cars</b>
            </Card.Header>
            <Card.Body style={{padding: '0px'}}>
              <small className="ml-2">By default only cars from today are loaded. Pick day range to load more.</small>
              <DateRangeSelector {...this.props} />
              <div className="d-flex justify-content-center flex-wrap">
                {cars}
              </div>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">This view shows you cars which require your attention</small>
            </Card.Footer>
          </Card>
        </div>

        <PlateEditModal
          show={this.state.plateEditModalData.show}
          title={this.state.plateEditModalData.title}
          description={this.state.plateEditModalData.description}
          id={this.state.plateEditModalData.id}
          licencePlate={this.state.plateEditModalData.licencePlate}
          ownerName={this.state.plateEditModalData.ownerName}
          closeHandler={() => this.plateEditModalCloseHandler}
          saveHandler={(plateObject: PlateEditModalPropsInterface) => this.plateEditModalSaveHandler(plateObject)}
          lpOnChange={(lp: string) => this.setState({
            plateEditModalData: {
              ...this.state.plateEditModalData,
              licencePlate: filterLicensePlate(lp)
            }
          })}
          ownerOnChange={(owner: string) => this.setState({
            plateEditModalData: {
              ...this.state.plateEditModalData,
              ownerName: owner
            }
          })}
          imageData={this.state.plateEditModalData.imageData}
          showReject={true}
          rejectHandler={(plateObject: PlateEditModalPropsInterface) => this.plateRejectHandler(plateObject)}
        />

      </div>
    )
  }

  plateEditModalCloseHandler = () => {
    this.setState({plateEditModalData: {show: false}});
  };

  plateEditModalSaveHandler = (plateObject: PlateEditModalPropsInterface) => {
    addLicensePlate(plateObject.licencePlate, plateObject.ownerName, Number(plateObject.id)).then((response: any) => {
      this.plateEditModalCloseHandler();
    }).catch((error: any) => {
      alert(error.response.data);
      this.plateEditModalCloseHandler();
    }).finally(() => {
      this.setState({
        licensePlateDetections: this.state.licensePlateDetections.filter((detection: LicensePlateDetectionsInterface) => {
          return String(detection.id) !== plateObject.id;
        })
      });
    });
  };

  plateRejectHandler = (plateObject: PlateEditModalPropsInterface) => {
    addLicensePlate(plateObject.licencePlate, plateObject.ownerName, Number(plateObject.id)).then((response: any) => {
      this.plateEditModalCloseHandler();
    }).catch((error: any) => {
      alert(error.response.data);
      this.plateEditModalCloseHandler();
    }).finally(() => {
      this.setState({
        licensePlateDetections: this.state.licensePlateDetections.filter((detection: LicensePlateDetectionsInterface) => {
          return String(detection.id) !== plateObject.id;
        })
      });
    });
  };

  addNewPlateHandler = (lpDetection: LicensePlateDetectionsInterface) => {
    this.setState({
      plateEditModalData: {
        show: true,
        title: 'Add new plate',
        description: 'Add new plate based on pre detection. Correct the plate based on image. License plate can be given with or without "-" character.',
        id: String(lpDetection.id),
        licencePlate: lpDetection.detectionResult,
        ownerName: '',
        imageData: lpDetection.image,
      }
    });
  };

}

const mapStateToProps = (state: any): any => {
  return {
    dateRangeStartDate: state.dateReducer.dateRangeStartDate,
    dateRangeEndDate: state.dateReducer.dateRangeEndDate,
  };
};

export default connect(mapStateToProps)(Cars);
