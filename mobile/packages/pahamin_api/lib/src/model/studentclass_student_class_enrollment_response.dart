//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/studentclass_class_ref.dart';
import 'package:pahamin_api/src/model/studentclass_user_ref.dart';
import 'package:json_annotation/json_annotation.dart';

part 'studentclass_student_class_enrollment_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class StudentclassStudentClassEnrollmentResponse {
  /// Returns a new [StudentclassStudentClassEnrollmentResponse] instance.
  StudentclassStudentClassEnrollmentResponse({

     this.class_,

     this.classId,

     this.createdAt,

     this.expiry,

     this.id,

     this.user,

     this.userId,
  });

  @JsonKey(
    
    name: r'class',
    required: false,
    includeIfNull: false,
  )


  final StudentclassClassRef? class_;



  @JsonKey(
    
    name: r'class_id',
    required: false,
    includeIfNull: false,
  )


  final int? classId;



  @JsonKey(
    
    name: r'created_at',
    required: false,
    includeIfNull: false,
  )


  final String? createdAt;



  @JsonKey(
    
    name: r'expiry',
    required: false,
    includeIfNull: false,
  )


  final String? expiry;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'user',
    required: false,
    includeIfNull: false,
  )


  final StudentclassUserRef? user;



  @JsonKey(
    
    name: r'user_id',
    required: false,
    includeIfNull: false,
  )


  final int? userId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is StudentclassStudentClassEnrollmentResponse &&
      other.class_ == class_ &&
      other.classId == classId &&
      other.createdAt == createdAt &&
      other.expiry == expiry &&
      other.id == id &&
      other.user == user &&
      other.userId == userId;

    @override
    int get hashCode =>
        class_.hashCode +
        classId.hashCode +
        createdAt.hashCode +
        expiry.hashCode +
        id.hashCode +
        user.hashCode +
        userId.hashCode;

  factory StudentclassStudentClassEnrollmentResponse.fromJson(Map<String, dynamic> json) => _$StudentclassStudentClassEnrollmentResponseFromJson(json);

  Map<String, dynamic> toJson() => _$StudentclassStudentClassEnrollmentResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

