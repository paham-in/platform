//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'upload_temp_delete_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UploadTempDeleteResponse {
  /// Returns a new [UploadTempDeleteResponse] instance.
  UploadTempDeleteResponse({

     this.ok,
  });

  @JsonKey(
    
    name: r'ok',
    required: false,
    includeIfNull: false,
  )


  final bool? ok;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UploadTempDeleteResponse &&
      other.ok == ok;

    @override
    int get hashCode =>
        ok.hashCode;

  factory UploadTempDeleteResponse.fromJson(Map<String, dynamic> json) => _$UploadTempDeleteResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UploadTempDeleteResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

