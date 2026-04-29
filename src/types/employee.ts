/** Shape of employee data returned from the corporate auth API */
export interface UserInfo {
  empNo: string;
  empName: string;
  empPositionCode: string;
  empPositionName: string;
  empPositionShotName: string;
  empPositionShortName: string;
  empSectCode: string;
  empSectName: string;
  empSectShotName: string;
  empSectShortName: string;
  empDeptCode: string;
  empDeptName: string;
  empDeptShotName: string;
  empDeptShortName: string;
  empLocationCode: string;
  empDivisionCode: string;
  empDivisionName: string;
  empEmail: string;
  empImg: string;
  empUserName: string;
}

/** Minimal subset written to the database when syncing a user */
export interface EmployeeData {
  empNo: string;
  empUserName: string;
  empEmail: string;
  empName?: string | null;
  empPositionName?: string | null;
  empPositionShortName?: string | null;
  empDeptName?: string | null;
  empDeptShortName?: string | null;
  empImg?: string | null;
}
