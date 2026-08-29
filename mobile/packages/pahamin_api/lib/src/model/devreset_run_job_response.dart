//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'devreset_run_job_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class DevresetRunJobResponse {
  /// Returns a new [DevresetRunJobResponse] instance.
  DevresetRunJobResponse({

     this.deleted,

     this.job,

     this.message,
  });

  @JsonKey(
    
    name: r'deleted',
    required: false,
    includeIfNull: false,
  )


  final int? deleted;



  @JsonKey(
    
    name: r'job',
    required: false,
    includeIfNull: false,
  )


  final String? job;



  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is DevresetRunJobResponse &&
      other.deleted == deleted &&
      other.job == job &&
      other.message == message;

    @override
    int get hashCode =>
        deleted.hashCode +
        job.hashCode +
        message.hashCode;

  factory DevresetRunJobResponse.fromJson(Map<String, dynamic> json) => _$DevresetRunJobResponseFromJson(json);

  Map<String, dynamic> toJson() => _$DevresetRunJobResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

